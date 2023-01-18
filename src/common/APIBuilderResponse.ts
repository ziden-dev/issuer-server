import { APIResponse } from './APIResponse.js';

export function buildResponse(apiCode: number, data: Object, message: string): APIResponse {
    return new APIResponse(apiCode, (data), message);
}

export function buildExceptionMessage(apiCode: number, message: string): APIResponse {
    return new APIResponse(apiCode, {}, message);
}

export function buildErrorMessage(apiCode: number, err: Error | string, message: string): APIResponse {
    if (typeof err == 'string')
        return new APIResponse(apiCode, { error: err }, message);

    return new APIResponse(apiCode, { error: err.message }, message);
}