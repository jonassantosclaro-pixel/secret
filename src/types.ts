/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id?: string;
  name: string;
  brand: string;
  price: number;
  description: string;
  imageUrl: string;
  stock: number;
  category: string; // "masculine" | "feminine" | "unisex" | "niche"
  createdAt?: any;
  updatedAt?: any;
}

export interface Brand {
  id?: string;
  name: string;
  logoUrl: string;
  createdAt?: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Coupon {
  id?: string;
  code: string;
  type: "percentage" | "fixed";
  value: number; // e.g., 10 for 10% or $10
  createdAt?: any;
}

export interface Socials {
  whatsapp: string;
  instagram: string;
  facebook: string;
  tiktok: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  couponCode: string;
  status: "pending" | "completed" | "cancelled";
  createdAt?: any;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  createdAt?: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
