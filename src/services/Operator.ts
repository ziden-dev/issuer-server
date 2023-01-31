import Operator from "../models/Operator.js";

export async function saveNewOperator(userId: string, role: number, claimId: string, issuerId: string) {
    const isOperatorExisted = await checkOperatorExisted(userId, issuerId);
    if (isOperatorExisted) {
        throw("Operator existed!");
    }

    const operator = new Operator({
        userId: userId,
        role: role,
        claimId: claimId,
        createAt: Number(Date.now()),
        issuerId: issuerId,
        activate: true
    });

    await operator.save();
}


export async function activateOperator(userId: string, issuerId: string) {
    const operator = await Operator.findOne({userId: userId, issuerId: issuerId});
    if (!operator) {
        throw("Operator  is not exits!");
    } else {
        operator.activate = true;
        await operator.save();
    }
}

export async function disableOperator(userId: string, issuerId: string) {
    const operator = await Operator.findOne({userId: userId, issuerId: issuerId});
    if (!operator) {
        throw("Operator  is not exits!");
    } else {
        operator.activate = false;
        await operator.save();true
    }
}

export async function checkOperatorExisted(userId: string, issuerId: string) {
    const lastOperator = await Operator.findOne({userId: userId, issuerId: issuerId});

    if (lastOperator) {
        return true;
    } else {
        return false;
    }
}

export async function createNewOperator(userId: string, issuerId: string) {
    const isOperatorExisted = await checkOperatorExisted(userId, issuerId);
    if (isOperatorExisted) {
        throw("Operator existed!");
    }
}