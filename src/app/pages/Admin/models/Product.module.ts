export interface ProductResponse {
    "id": number,
    "productId": number,
    "productName": string,
    "productPrice": string,
    "vendorId": number,
    "vendorCompanyName":string,
    "warehouseId": number,
    "warehouseCode": string,
    "warehouseLocation": string,
    "stock": number,
    "maxStock": number,
    "rolPercent": number,
    "currentStockPercent":number,
    "belowRol": boolean
}