export class PaymentDto {

  constructor(
    public readonly from: Date,
    public readonly to: Date,
    public readonly price: number
  ){

  }

}
