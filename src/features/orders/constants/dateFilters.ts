import {OrderDateFilter} from '../services/ordersService';

export const orderDateFilterOptions: Array<{
  label: string;
  value: OrderDateFilter;
}> = [
  {label: 'Activos', value: 'active'},
  {label: 'Hoy', value: 'today'},
  {label: 'Ultimos 7 dias', value: '7d'},
  {label: 'Ultimo mes', value: '1m'},
  {label: 'Ultimos 3 meses', value: '3m'},
];
