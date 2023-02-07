export class AccountDto {

  constructor(
    public readonly email: string,
    public readonly licensePlates: string[],
    public readonly isAdmin: boolean
  ){
  }
}
