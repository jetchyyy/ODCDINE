import type { OrderStatus } from '../../types/domain';

export function humanizeStatus(status: OrderStatus) {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}
