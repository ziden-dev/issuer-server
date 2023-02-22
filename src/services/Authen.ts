import axios from "axios";
import { AUTHEN_SERVER } from "../common/config/secrets.js";
import AuthenClaim from "../models/AuthenClaim.js";

export async function verifyToken(token: string, issuerId: string, isAdmin: boolean) {
    try {
        if (!token || !issuerId) {
            return false;
        }
    
        let url = AUTHEN_SERVER;
        if (isAdmin) {
            url += `/api/v1/auth/verify-token-admin/${issuerId}`;
        } else {
            url += `/api/v1/auth/verify-token/${issuerId}`;
        }
    
        const response = await axios.request({
            method: "POST",
            url: url,
            data: {
                "token": token
            }
        });
    
        if (response.data["isValid"]) {
            return true;
        } else {
            return false;
        }
    } catch (err: any) {
        return false;
    }
    
}

export async function login(data: any, issuerId: string) {
    if (!issuerId) {
        throw("Invalid issuerId");
    }

    try {
        let url = AUTHEN_SERVER + `/api/v1/auth/login/${issuerId}`;
        const respone = await axios.request({
            method: "POST",
            url: url,
            data: data
        });

        const token = respone.data["token"];
        if (token == undefined) {
            throw("Invalid request");
        }
        return token;

    } catch (err) {
        throw("Invalid request");
    }
}

export async function registerNewIssuer(issuerId: string) {
    try {
        const url = AUTHEN_SERVER + "/api/v1/issuers/register";
        const response = await axios.request({
            method: "POST",
            url: url,
            data: {
                "issuerId": issuerId
            }
        });

        return {
            userId: response.data.userId,
            issuerId: response.data.issuerId,
            operator: response.data.operator,
            claimId: response.data.claimId,
            version: response.data.version,
            revNonce: response.data.revNonce
        };
    } catch (err: any) {
        throw("Invalid request");
    }
}

export async function createOperator(operatorId: string, issuerId: string, token: string) {
    try {
        const url = AUTHEN_SERVER + `/api/v1/issuers/${issuerId}/operators`;
        const response = await axios.request({
            method: "POST",
            url: url,
            data: {
                "operatorId": operatorId
            },
            headers: {
                "Authorization": token
            }
        });

        return {
            userId: response.data.userId,
            issuerId: response.data.issuerId,
            operator: response.data.operator,
            claimId: response.data.claimId,
            version: response.data.version,
            revNonce: response.data.revNonce
        };
    } catch (err: any) {
        throw("Invalid request");
    }
}

export async function revokeOperator(operatorId: string, issuerId: string, token: string) {
    try {
        const url = AUTHEN_SERVER + `/api/v1/issuers/${issuerId}/operators/${operatorId}`;
        const response = await axios.request({
            method: "DELETE",
            url: url,
            headers: {
                "Authorization": token
            }
        });

    } catch (err: any) {
        throw("Invalid request");
    }
}

export async function getAuthenProof(claimId: string, type: string) {
    let url = AUTHEN_SERVER + `/api/v1/claims/${claimId}/proof?type=${type}`;
    const proof = await axios.request({
        method: "GET",
        url: url
    });
    return proof.data;
}

export async function checkAuthenClaimExist(claimId: string) {
    const authenClaim = await AuthenClaim.findOne({claimId: claimId});
    if (authenClaim) {
        return true;
    } else {
        return false;
    }
}

export async function getOperatorInforInAuthen(operatorId: string, issuerId: string) {
    let url = AUTHEN_SERVER + `/api/v1/issuers/${issuerId}/operators/${operatorId}`;
    const response = await axios.request({
        method: "GET",
        url: url
    });
    return response.data;
}