export class AccountDto {

  constructor(
    public readonly email: string,
    public readonly licensePlates: string[]
  ){
  }
}
