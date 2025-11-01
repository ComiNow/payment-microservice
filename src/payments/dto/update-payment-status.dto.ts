import { IsNotEmpty, IsString } from "class-validator";

export class UpdatePaymentStatusDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsString()
  @IsNotEmpty()
  businessId: string;
}