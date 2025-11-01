import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsPositive, IsString, ValidateNested } from "class-validator";


export class PaymentPreferenceDto {

   @IsNumber()
   @IsPositive()
   orderId: number;

   @IsString()
   @IsNotEmpty()
   businessId: string;

   @IsArray()
   @ArrayMinSize(1)
   @ValidateNested({ each: true })
   @Type(() => PaymentItemDto)
   items: PaymentItemDto[]
}

export class PaymentItemDto {
   @IsNumber()
   @IsPositive()
   id: number;

   @IsString()
   name: string;

   @IsNumber()
   @IsPositive()
   price: number;

   @IsNumber()
   @IsPositive()
   quantity: number;
}