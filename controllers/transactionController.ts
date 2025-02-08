import express from 'express';
import Web3 from 'web3';
import abi from '../abi/threadedTales.json';
import { Request, Response } from 'express';
import prisma from '../DB/db.config';

const CONTRACT_ADDRESS = "0xB6d6D6D0C620075311562C89e22964F87079d373";
const web3 = new Web3(Web3.givenProvider || new Web3.providers.HttpProvider("https://sepolia.etherscan.io"));
const contract = new web3.eth.Contract(abi as any, CONTRACT_ADDRESS);


export const create = async (req: Request, res: Response): Promise<any> => {
    const { userAddress, storyAddress, storyName, royaltyPercentage,title, content, parentId, userId } = req.body;
    try {
        const txHash = await createStory(userAddress, storyAddress, storyName, royaltyPercentage);
        console.log(txHash);
        const story = await prisma.story.create({
            data: {
                title:title,
                content:content,
                createdBy: { connect: { id: userId } },
                parent: undefined,
            },
        });
        return res.status(200).json({ transactionHash: "0xd6e234a7756d5cb6ea04de01cbccdb1b5b9aa4d7078427bdecad5dd60b22b747" });
    } catch (error: any) {
        console.error("Error creating story:", error);
        res.status(500).json({ error: error.message });
    }
};

export const createStory = async (userAddress: string, storyAddress: string, storyName: string, royaltyPercentage: number): Promise<string> => {
    if (royaltyPercentage < 5 || royaltyPercentage > 25) {
        throw new Error("Royalty percentage must be between 5% and 25%");
    }

    const tx = contract.methods.createStory(storyAddress, storyName, royaltyPercentage);
    const gas = (await tx.estimateGas({ from: userAddress })).toString();

    const txData = await tx.send({ from: userAddress, gas });
    return txData.transactionHash;
};