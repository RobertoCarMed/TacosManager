export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type WaiterStackParamList = {
  CreateOrder: undefined;
  EditOrder: {orderId: string};
  WaiterOrders: undefined;
};

export type KitchenStackParamList = {
  KitchenDashboard: undefined;
  CreateProduct: undefined;
  EditProduct: undefined;
  Settings: undefined;
};
