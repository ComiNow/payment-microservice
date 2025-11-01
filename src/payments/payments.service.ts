import { Inject, Injectable, Logger, Scope, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { Items } from 'mercadopago/dist/clients/commonTypes';
import { MercadoPagoPaymentResponse } from './interface/mercado-pago.interface';
import axios from 'axios';
import * as crypto from 'crypto';

import { PaymentPreferenceDto } from './dto/payment-preference.dto';
import { envs } from '../config/envs';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { SecureConfigService } from '../secure-config/secure-config.service';

@Injectable({ scope: Scope.REQUEST })
export class PaymentsService {

	private readonly logger = new Logger(PaymentsService.name);

	constructor(
		@Inject(envs.natsServiceName) private readonly client: ClientProxy,
		@Inject() private readonly secureConfigService: SecureConfigService
	) { }

	async createNewPreference(paymentSessionDto: PaymentPreferenceDto) {
		const { items, orderId, businessId } = paymentSessionDto;
		const credential = await this.secureConfigService.getPaymentConfig('mercado-pago', businessId);

		if (!credential) {
			this.logger.error(`No credentials found for businessId: ${businessId}`);
			throw new Error(`No credentials found for businessId: ${businessId}`);
		}
		const mercadoPagoService = new MercadoPagoConfig({ accessToken: credential.accessToken });

		const preferenceItems: Items[] = items.map(item => {
			return {
				id: item.id.toString(),
				title: item.name,
				quantity: item.quantity,
				unit_price: item.price,
			}
		})

		const preference = new Preference(mercadoPagoService);

		try {
			const response = await preference.create({
				body: {
					payment_methods: {
						excluded_payment_methods: [
							{ id: "codensa" }
						],
						excluded_payment_types: [
							{ id: "ticket" }
						],
						installments: 1
					},
					items: preferenceItems,
					metadata: { orderId: orderId, businessId: businessId },
					back_urls: {
						success: `${envs.appServiceClientBaseUrl}`,
						// failure: `${envs.frontendUrl}/payment/failure`,
						// pending: `${envs.frontendUrl}/payment/pending`
					},
					auto_return: 'approved',
				}
			});
			const { id: preferenceId, init_point } = response;
			this.logger.log(`Preference created: ${JSON.stringify(preferenceId)}`)
			return { preferenceId, init_point };
		} catch (error) {
			this.logger.error(`Error creating preference: ${JSON.stringify(error)}`)
			throw error;
		}
	}

	async updatePaymentStatus(updatePaymentStatusDto: UpdatePaymentStatusDto) {
		const { paymentId, businessId } = updatePaymentStatusDto;
		const credential = await this.secureConfigService.getPaymentConfig('mercado-pago', businessId);

		if (!credential) {
			this.logger.error(`No credentials found for businessId: ${businessId}`);
			throw new Error(`No credentials found for businessId: ${businessId}`);
		}

		const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
			headers: {
				'Authorization': `Bearer ${credential.accessToken}`,
			}
		});

		const paymentData: MercadoPagoPaymentResponse = response.data;
		const { status, metadata } = paymentData;
		const metaDataOrderId = metadata.order_id;
		const metaDataBusinessId = metadata.business_id;
		this.logger.log(`Updating order status for orderId: ${metaDataOrderId} with status: ${status}`);

		try {
			if (status === 'approved') {
				this.client.emit('payment.succeeded', {
					orderId: metaDataOrderId,
					businessId: metaDataBusinessId,
					status
				});
				this.logger.log(`Order status updated successfully for orderId: ${metaDataOrderId}`);
			}
		} catch (error) {
			this.logger.error(`Error updating order status for orderId: ${metaDataOrderId}`, error);
			throw error;
		}
	}

	async handleWebhookEvent(req: Request, res: Response) {
		const xSignature = req.headers['x-signature'] as string;
		const xRequestId = req.headers['x-request-id'];
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const dataId = urlParams.get('data.id');
		const businessId = req.query['businessId'] as string;

		const parts = xSignature?.split(',');
		const ts = parts?.find(part => part.startsWith('ts=')).split('=')[1];
		const hash = parts?.find(part => part.startsWith('v1=')).split('=')[1];

		try {
			const credential = await this.secureConfigService.getPaymentConfig('mercado-pago', businessId);

			if (!credential) {
				this.logger.error(`No credentials found for businessId: ${businessId}`);
				throw new Error(`No credentials found for businessId: ${businessId}`);
			}

			const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

			const hmac = crypto.createHmac('sha256', credential.webhookSecret);
			hmac.update(manifest);

			const sha = hmac.digest('hex');

			if (sha !== hash) {
				this.logger.error("HMAC verification failed");
				return res.status(400).json({ error: 'HMAC verification failed' });
			}

			this.client.emit('update.payment.status', { paymentId: dataId, businessId: businessId });
			this.logger.log(`Payment status update event emitted for dataId: ${dataId}`);
		} catch (error) {
			this.logger.error(`Error emitting payment status update event for dataId: ${dataId}`, error);
		}
		return res.status(200).json({ recived: true });
	}

}
