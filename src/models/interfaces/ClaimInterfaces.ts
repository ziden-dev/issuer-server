export interface ClaimInterface {
    id: string,
    hi: string,
    hv: string,
    schemaHash: string,
    expiration: number,
    updatable: boolean,
    version: number,
    revNonce: number,
    createAt: number,
    status: string,
    userId: string,
    proofType: string,
    issuerID: string,
    schemaRegistryId: string
}