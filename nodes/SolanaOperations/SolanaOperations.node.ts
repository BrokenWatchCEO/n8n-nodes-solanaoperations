import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import {
	Connection,
	PublicKey,
	Keypair,
	Transaction,
	SystemProgram,
	TransactionMessage,
	VersionedTransaction,
	StakeProgram,
} from '@solana/web3.js';
import {
	getAssociatedTokenAddressSync,
	createTransferInstruction,
	createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import bs58 from 'bs58';
import { TextEncoder } from 'util'; // Para solucionar el error de TextEncoder
import nacl from 'tweetnacl';

export class SolanaOperations implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Solana',
		name: 'solanaOperations',
		icon: 'file:SolanaOperations.svg',
		
		group: ['transform'],
		version: 1,
		description:
			'Perform operations on Solana network: send SOL, send token, get balance, create wallet, sign/verify messages, stake, and more.',
		defaults: {
			name: 'Solana',
			
		},
		// @ts-ignore
		inputs: ['main'],
		// @ts-ignore
		outputs: ['main'],
		credentials: [
			{
				name: 'solanaApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create Wallet',
						value: 'createWallet',
						action: 'Generate a new wallet',
						description: 'Generate a new Solana wallet (keypair)',
					},
					{
						name: 'Get Account Info',
						value: 'getAccountInfo',
						action: 'Get account information',
						description: 'Retrieve detailed info about a Solana account',
					},
					{
						name: 'Get Balance',
						value: 'getBalance',
						action: 'Get the SOL balance of an address',
						description: 'Get the SOL balance of an address',
					},
					{
						name: 'Get Multiple Token Balances',
						value: 'getMultipleTokenBalances',
						action: 'Get balances for multiple tokens',
						description: 'Retrieve balances for multiple tokens for a given address',
					},
					{
						name: 'Get Token Balance',
						value: 'getTokenBalance',
						action: 'Get the SPL token balance of an address',
						description: 'Get the SPL token balance of an address',
					},
					{
						name: 'Get Transaction Details',
						value: 'getTxDetails',
						action: 'Get details of a transaction',
						description: 'Fetch and parse transaction details by signature',
					},
					{
						name: 'Send SOL',
						value: 'sendSol',
						action: 'Send SOL to an address',
						description: 'Send SOL to an address',
					},
					{
						name: 'Send Token',
						value: 'sendToken',
						action: 'Send an SPL token to an address',
						description: 'Send an SPL token to an address',
					},
					{
						name: 'Sign Message',
						value: 'signMessage',
						action: 'Sign a message',
						description: 'Sign a message with your private key',
					},
					{
						name: 'Stake SOL',
						value: 'stakeSol',
						action: 'Stake SOL to a validator',
						description: 'Create a stake account and delegate SOL to a validator',
					},
					{
						name: 'Verify Signature',
						value: 'verifySignature',
						action: 'Verify a signature',
						description: 'Verify a signature against a message and public key',
					},
					{
						name: 'Withdraw Stake',
						value: 'withdrawStake',
						action: 'Withdraw staked SOL',
						description: 'Withdraw staked SOL from a stake account',
					},
				],
				default: 'sendSol',
			},
			{
				displayName: 'Recipient / Address',
				name: 'address',
				type: 'string',
				default: '',
				description:
					'The address to send to or get balance from. Para "getBalance" se usará la cuenta del remitente si se deja vacío.',
				displayOptions: {
					show: {
						operation: [
							'sendSol',
							'sendToken',
							'getBalance',
							'getTokenBalance',
							'getMultipleTokenBalances',
						],
					},
				},
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				default: 0,
				description: 'Amount to send (in SOL or tokens) or stake amount',
				displayOptions: {
					show: {
						operation: ['sendSol', 'sendToken', 'stakeSol', 'withdrawStake'],
					},
				},
			},
			{
				displayName: 'Token Mint Address',
				name: 'tokenMint',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description:
					'Token mint address (required for sending tokens or checking token balance)',
				displayOptions: {
					show: {
						operation: ['sendToken', 'getTokenBalance', 'getMultipleTokenBalances'],
					},
				},
			},
			{
				displayName: 'Include Donation (1% to Devs)',
				name: 'includeDonation',
				type: 'boolean',
				default: true,
				description: 'Whether to automatically send 1% of the amount as a donation to the dev team',

				displayOptions: {
					show: {
						operation: ['sendSol'],
					},
				},
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				description: 'Message to sign or verify',
				displayOptions: {
					show: {
						operation: ['signMessage', 'verifySignature'],
					},
				},
			},
			{
				displayName: 'Signature',
				name: 'signature',
				type: 'string',
				default: '',
				description: 'Signature to verify (base58 encoded)',
				displayOptions: {
					show: {
						operation: ['verifySignature'],
					},
				},
			},
			{
				displayName: 'Public Key',
				name: 'pubKey',
				type: 'string',
				default: '',
				description: 'Public key for signature verification (base58 encoded)',
				displayOptions: {
					show: {
						operation: ['verifySignature'],
					},
				},
			},
			{
				displayName: 'Transaction Signature',
				name: 'txSignature',
				type: 'string',
				default: '',
				description: 'Signature of the transaction to look up',
				displayOptions: {
					show: {
						operation: ['getTxDetails'],
					},
				},
			},
			{
				displayName: 'Account Address',
				name: 'accountAddress',
				type: 'string',
				default: '',
				description: 'The account address to retrieve information from',
				displayOptions: {
					show: {
						operation: ['getAccountInfo'],
					},
				},
			},
			{
				displayName: 'Token Mints (Comma Separated)',
				name: 'tokenMints',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Comma-separated list of token mint addresses',
				displayOptions: {
					show: {
						operation: ['getMultipleTokenBalances'],
					},
				},
			},
			{
				displayName: 'Validator Vote Account',
				name: 'validator',
				type: 'string',
				default: '',
				description: 'Validator vote account public key to delegate stake to',
				displayOptions: {
					show: {
						operation: ['stakeSol'],
					},
				},
			},
			{
				displayName: 'Stake Account Address',
				name: 'stakeAccount',
				type: 'string',
				default: '',
				description: 'The stake account address for withdrawal',
				displayOptions: {
					show: {
						operation: ['withdrawStake'],
					},
				},
			},
			{
				displayName: 'Destination Address',
				name: 'destination',
				type: 'string',
				default: '',
				description: 'The destination address to receive withdrawn SOL',
				displayOptions: {
					show: {
						operation: ['withdrawStake'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		// Retrieve configured credentials
		const credentials = await this.getCredentials('solanaApi');
		if (!credentials) {
			throw new NodeOperationError(this.getNode(), 'No credentials returned!');
		}
		const privateKey = credentials.privateKey as string;
		const rpcUrl = credentials.rpcUrl as string;

		// Initialize Solana connection
		const connection = new Connection(rpcUrl);
		// Decode private key from Base58 format (para operaciones que requieren la clave del remitente)
		const senderSecretKey = bs58.decode(privateKey);
		const senderKeypair = Keypair.fromSecretKey(senderSecretKey);

		// Process each input
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				if (operation === 'sendSol') {
					const recipient = this.getNodeParameter('address', itemIndex) as string;
					const amount = this.getNodeParameter('amount', itemIndex) as number;
					const lamports = amount * 1e9;

					// Obtener un blockhash fresco
					const { blockhash } = await connection.getLatestBlockhash();
					const transaction = new Transaction({
						recentBlockhash: blockhash,
						feePayer: senderKeypair.publicKey,
					});
					// Instrucción principal: transferencia a destinatario
					transaction.add(
						SystemProgram.transfer({
							fromPubkey: senderKeypair.publicKey,
							toPubkey: new PublicKey(recipient),
							lamports,
						})
					);
					// Si la opción de donación está activa, se añade la transferencia del 1% a la dirección fija
					const includeDonation = this.getNodeParameter('includeDonation', itemIndex) as boolean;
					if (includeDonation) {
						transaction.add(
							SystemProgram.transfer({
								fromPubkey: senderKeypair.publicKey,
								toPubkey: new PublicKey('9XSkMzfD6FapMwcCYzfyZSjQ1R3bjpUB4txLm2DPco8P'),
								lamports: Math.floor(lamports * 0.01),
							})
						);
					}
					transaction.sign(senderKeypair);
					const txSignature = await connection.sendRawTransaction(transaction.serialize());
					returnData.push({
						json: {
							success: true,
							txSignature,
							operation,
						},
					});
				} else if (operation === 'sendToken') {
					const recipient = this.getNodeParameter('address', itemIndex) as string;
					const amount = this.getNodeParameter('amount', itemIndex) as number;
					const tokenMint = this.getNodeParameter('tokenMint', itemIndex) as string;

					const mintPubkey = new PublicKey(tokenMint);
					const recipientPubkey = new PublicKey(recipient);
					const senderPubkey = senderKeypair.publicKey;

					const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
					let decimals = 9;
					if (mintInfo.value && (mintInfo.value.data as any)?.parsed?.info?.decimals !== undefined) {
						decimals = (mintInfo.value.data as any).parsed.info.decimals;
					}

					const adjustedAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));
					const senderATA = getAssociatedTokenAddressSync(mintPubkey, senderPubkey);
					const recipientATA = getAssociatedTokenAddressSync(mintPubkey, recipientPubkey);

					const instructions = [];
					const recipientATAInfo = await connection.getAccountInfo(recipientATA);
					if (!recipientATAInfo) {
						instructions.push(
							createAssociatedTokenAccountInstruction(
								senderKeypair.publicKey,
								recipientATA,
								recipientPubkey,
								mintPubkey
							)
						);
					}
					instructions.push(
						createTransferInstruction(
							senderATA,
							recipientATA,
							senderKeypair.publicKey,
							adjustedAmount
						)
					);

					const { blockhash } = await connection.getLatestBlockhash();
					const messageV0 = new TransactionMessage({
						payerKey: senderKeypair.publicKey,
						recentBlockhash: blockhash,
						instructions,
					}).compileToV0Message();
					const versionedTx = new VersionedTransaction(messageV0);
					versionedTx.sign([senderKeypair]);
					const txSignature = await connection.sendTransaction(versionedTx);
					returnData.push({
						json: {
							success: true,
							txSignature,
							operation,
						},
					});
				} else if (operation === 'getBalance') {
					const address =
						(this.getNodeParameter('address', itemIndex) as string) ||
						senderKeypair.publicKey.toBase58();
					const balance = await connection.getBalance(new PublicKey(address));
					const solBalance = balance / 1e9;
					returnData.push({
						json: {
							success: true,
							balance: solBalance,
							operation,
						},
					});
				} else if (operation === 'getTokenBalance') {
					const address = this.getNodeParameter('address', itemIndex) as string;
					const tokenMint = this.getNodeParameter('tokenMint', itemIndex) as string;
					const mintPubkey = new PublicKey(tokenMint);
					const ownerPubkey = new PublicKey(address);
					const ata = getAssociatedTokenAddressSync(mintPubkey, ownerPubkey);
					const tokenAccountBalance = await connection.getTokenAccountBalance(ata);
					returnData.push({
						json: {
							success: true,
							balance: tokenAccountBalance.value.uiAmount,
							operation,
						},
					});
				} else if (operation === 'createWallet') {
					const newKeypair = Keypair.generate();
					returnData.push({
						json: {
							success: true,
							publicKey: newKeypair.publicKey.toBase58(),
							privateKey: bs58.encode(newKeypair.secretKey),
							operation,
						},
					});
				} else if (operation === 'signMessage') {
					const message = this.getNodeParameter('message', itemIndex) as string;
					if (!message) {
						throw new NodeOperationError(this.getNode(), 'Message is required for signing', { itemIndex });
					}
					const messageUint8 = new TextEncoder().encode(message);
					const signature = nacl.sign.detached(messageUint8, senderKeypair.secretKey);
					returnData.push({
						json: {
							success: true,
							signature: bs58.encode(signature),
							operation,
						},
					});
				} else if (operation === 'verifySignature') {
					const message = this.getNodeParameter('message', itemIndex) as string;
					const signatureInput = this.getNodeParameter('signature', itemIndex) as string;
					const pubKeyInput = this.getNodeParameter('pubKey', itemIndex) as string;
					if (!message || !signatureInput || !pubKeyInput) {
						throw new NodeOperationError(this.getNode(), 'Message, signature and public key are required for verification', { itemIndex });
					}
					const messageUint8 = new TextEncoder().encode(message);
					const signatureUint8 = bs58.decode(signatureInput);
					const publicKeyUint8 = bs58.decode(pubKeyInput);
					const isValid = nacl.sign.detached.verify(messageUint8, signatureUint8, publicKeyUint8);
					returnData.push({
						json: {
							success: true,
							isValid,
							operation,
						},
					});
				} else if (operation === 'getTxDetails') {
					const txSignature = this.getNodeParameter('txSignature', itemIndex) as string;
					const txDetails = await connection.getTransaction(txSignature, { maxSupportedTransactionVersion: 0 });
					if (!txDetails) {
						throw new NodeOperationError(this.getNode(), `No transaction details found for signature: ${txSignature}`, { itemIndex });
					}
					returnData.push({
						json: {
							success: true,
							txDetails,
							operation,
						},
					});
				} else if (operation === 'getAccountInfo') {
					const accountAddress = this.getNodeParameter('accountAddress', itemIndex) as string;
					if (!accountAddress) {
						throw new NodeOperationError(this.getNode(), 'Account address is required', { itemIndex });
					}
					const accountInfo = await connection.getAccountInfo(new PublicKey(accountAddress));
					if (!accountInfo) {
						throw new NodeOperationError(this.getNode(), `No account info found for address: ${accountAddress}`, { itemIndex });
					}
					returnData.push({
						json: {
							success: true,
							accountInfo,
							operation,
						},
					});
				} else if (operation === 'getMultipleTokenBalances') {
					const address = this.getNodeParameter('address', itemIndex) as string;
					const tokenMints = (this.getNodeParameter('tokenMints', itemIndex) as string)
						.split(',')
						.map((mint: string) => mint.trim())
						.filter((mint: string) => mint !== '');
					const balances: Record<string, any> = {};
					for (const mint of tokenMints) {
						const mintPubkey = new PublicKey(mint);
						const ownerPubkey = new PublicKey(address);
						const ata = getAssociatedTokenAddressSync(mintPubkey, ownerPubkey);
						try {
							const tokenAccountBalance = await connection.getTokenAccountBalance(ata);
							balances[mint] = tokenAccountBalance.value.uiAmount;
						} catch (error) {
							balances[mint] = null;
						}
					}
					returnData.push({
						json: {
							success: true,
							balances,
							operation,
						},
					});
				} else if (operation === 'stakeSol') {
					const amount = this.getNodeParameter('amount', itemIndex) as number;
					const validator = this.getNodeParameter('validator', itemIndex) as string;
					const lamports = amount * 1e9;
					const stakeAccount = Keypair.generate();
					const rentExemption = await connection.getMinimumBalanceForRentExemption(200);
					const totalLamports = lamports + rentExemption;
					const { blockhash } = await connection.getLatestBlockhash();
					const createAccountIx = SystemProgram.createAccount({
						fromPubkey: senderKeypair.publicKey,
						newAccountPubkey: stakeAccount.publicKey,
						lamports: totalLamports,
						space: 200,
						programId: StakeProgram.programId,
					});
					const initializeStakeIx = StakeProgram.initialize({
						stakePubkey: stakeAccount.publicKey,
						authorized: {
							staker: senderKeypair.publicKey,
							withdrawer: senderKeypair.publicKey,
						},
					});
					const delegateIx = StakeProgram.delegate({
						stakePubkey: stakeAccount.publicKey,
						authorizedPubkey: senderKeypair.publicKey,
						votePubkey: new PublicKey(validator),
					});
					const transaction = new Transaction({
						recentBlockhash: blockhash,
						feePayer: senderKeypair.publicKey,
					});
					transaction.add(createAccountIx, initializeStakeIx, delegateIx);
					transaction.sign(senderKeypair, stakeAccount);
					const txSignature = await connection.sendRawTransaction(transaction.serialize());
					returnData.push({
						json: {
							success: true,
							stakeAccount: stakeAccount.publicKey.toBase58(),
							txSignature,
							operation,
						},
					});
				} else if (operation === 'withdrawStake') {
					const stakeAccountAddress = this.getNodeParameter('stakeAccount', itemIndex) as string;
					const destination = this.getNodeParameter('destination', itemIndex) as string;
					const amount = this.getNodeParameter('amount', itemIndex) as number;
					const lamports = amount * 1e9;
					const { blockhash } = await connection.getLatestBlockhash();
					const transaction = new Transaction({
						recentBlockhash: blockhash,
						feePayer: senderKeypair.publicKey,
					});
					const withdrawIx = StakeProgram.withdraw({
						stakePubkey: new PublicKey(stakeAccountAddress),
						authorizedPubkey: senderKeypair.publicKey,
						toPubkey: new PublicKey(destination),
						lamports,
					});
					transaction.add(withdrawIx);
					transaction.sign(senderKeypair);
					const txSignature = await connection.sendRawTransaction(transaction.serialize());
					returnData.push({
						json: {
							success: true,
							txSignature,
							operation,
						},
					});
				} else {
					throw new NodeOperationError(this.getNode(), 'Unsupported operation');
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						pairedItem: itemIndex,
					});
				} else {
					throw new NodeOperationError(this.getNode(), error, { itemIndex });
				}
			}
		}

		return this.prepareOutputData(returnData);
	}
}
