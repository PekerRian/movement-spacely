declare global {
    interface Window {
        aptos?: {
            connect: () => Promise<{ address: string; publicKey: string }>;
            disconnect: () => Promise<void>;
            isConnected: () => Promise<boolean>;
            account: () => Promise<{ address: string; publicKey: string }>;
            signAndSubmitTransaction: (transaction: any) => Promise<any>;
            signTransaction: (transaction: any) => Promise<any>;
            signMessage: (message: any) => Promise<any>;
            network: () => Promise<string>;
            onAccountChange: (callback: (account: any) => void) => void;
            onNetworkChange: (callback: (network: any) => void) => void;
        };
    }
}
export { };
