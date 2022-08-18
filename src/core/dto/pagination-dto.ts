export class PaginationDto<E> {
  constructor(
    public readonly count: number,
    public readonly data: E[]
  ){

  }
}
