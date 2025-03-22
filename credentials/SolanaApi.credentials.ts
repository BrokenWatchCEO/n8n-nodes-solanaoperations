import {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SolanaApi implements ICredentialType {
	name = 'solanaApi';
	displayName = 'Solana API';
	
	properties: INodeProperties[] = [
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			},
			description:
				'Clave privada del wallet en formato Base58, por ejemplo: 4x3Eic2vCodAiWEm177io2aC2G2xJb1snxGQiGeybVXctgY89e2JTC6cKgkwT9XYPSuspYkS3pemaiiWePCBbJsu',
		},
		{
			displayName: 'RPC URL',
			name: 'rpcUrl',
			type: 'string',
			default: 'https://api.mainnet-beta.solana.com',
			description: 'Endpoint RPC de Solana',
		},
	];

	// Se omite la propiedad authenticate, ya que no se usa para llamadas HTTP

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.rpcUrl }}',
			url: '',
		},
	};
}
