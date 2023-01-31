
import { getNetwork } from "@ethersproject/networks";
import { v4 } from "uuid";
import Network from "../models/Network.js";

export async function checkNetworkExisted(chainId: string, name: string, shotName: string): Promise<boolean> {
    const lastNetwork = await Network.findOne({
        chainId: chainId,
        name: name,
        shotName: shotName
    });

    if (lastNetwork) {
        return true;
    } else {
        return false;
    }
}

export async function createNetwork(chainId: string, name: string, shotName: string) {
    const isNetworkExisted = await checkNetworkExisted(chainId, name, shotName);
    if (isNetworkExisted) {
        throw ("Network is existed")
    }
    const network = new Network({
        id: v4(),
        chainId: chainId,
        createAt: Number(Date.now()),
        name: name,
        shotName: shotName,
        updateAt: Number(Date.now())
    })
    await network.save();
    return {
        id: network.id,
        chainId: network.chainId,
        createAt: network.createAt,
        name: network.name,
        shotname: network.shotName,
        updateAt: network.updateAt
    }
}

export async function updateNetwork(id: string, chainId: string, name: string, shotName: string) {
    const lastNetwork = await Network.findOne({ id: id })
    if (!lastNetwork) {
        throw ("Network is not existed")
    }
    else {
        lastNetwork.chainId = chainId;
        lastNetwork.name = name;
        lastNetwork.shotName = shotName;
        lastNetwork.updateAt = Number(Date.now());
        await lastNetwork.save();
        return {
            id: lastNetwork.id,
            chainId: lastNetwork.chainId,
            createAt: lastNetwork.createAt,
            name: lastNetwork.name,
            shotname: lastNetwork.shotName,
            updateAt: lastNetwork.updateAt
        }
    }
}

export async function removeNetwork(id: string) {
    const lastNetwork = await Network.findOne({ id: id })
    if (!lastNetwork) {
        throw ("Network is not existed")
    }
    else {
        await lastNetwork.remove();
    }
}

export async function getNetworkById(id: string) {
    const network = await Network.findOne({ id: id })
    if (!network) {
        throw ("Network is not existed")
    }
    else {
        return {
            id: network.id,
            chainId: network.chainId,
            createAt: network.createAt,
            name: network.name,
            shotName: network.shotName,
            updateAt: network.updateAt
        }
    }
}

export async function getAllNetworks() {
    const allNetworks = await Network.find();
    if (!allNetworks) {
        throw ("No network exist")
    }
    else {
        return allNetworks.map(e => {
            return {
                id: e.id,
                chainId: e.chainId,
                createAt: e.createAt,
                name: e.name,
                shotName: e.shotName,
                updateAt: e.updateAt
            }
        })
    }
}