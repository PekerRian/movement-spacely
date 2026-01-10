import { NETWORK_CONFIG } from '../constants/contracts';

/**
 * Indexer service for efficient read-only queries without requiring transactions
 * Uses GraphQL to query blockchain state indexed data
 */

interface IndexerResponse<T> {
    data?: T;
    errors?: Array<{ message: string }>;
}

/**
 * Execute a GraphQL query against the indexer
 */
async function queryIndexer<T>(query: string, variables?: Record<string, any>): Promise<T | null> {
    try {
        const response = await fetch(NETWORK_CONFIG.INDEXER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables,
            }),
        });

        if (!response.ok) {
            console.error('Indexer query failed:', response.status);
            return null;
        }

        const result: IndexerResponse<T> = await response.json();

        if (result.errors) {
            console.error('GraphQL Errors:', result.errors);
            return null;
        }

        return result.data || null;
    } catch (error) {
        console.error('Error querying indexer:', error);
        return null;
    }
}

/**
 * Get direct messages between two users using indexer
 * This is a read-only operation - no transaction needed
 */
export async function getDirectMessagesFromIndexer(
    senderAddress: string,
    recipientAddress: string,
    limit: number = 50
): Promise<any[] | null> {
    const query = `
        query GetDirectMessages($sender: String!, $recipient: String!, $limit: Int!) {
            direct_messages(
                where: {
                    _or: [
                        {sender: {_eq: $sender}, recipient: {_eq: $recipient}},
                        {sender: {_eq: $recipient}, recipient: {_eq: $sender}}
                    ]
                }
                order_by: [{timestamp: desc}]
                limit: $limit
            ) {
                sender
                recipient
                content
                timestamp
                id
            }
        }
    `;

    const variables = {
        sender: senderAddress,
        recipient: recipientAddress,
        limit,
    };

    console.log('Fetching direct messages from indexer:', { senderAddress, recipientAddress });
    const result = await queryIndexer<{ direct_messages: any[] }>(query, variables);
    return result?.direct_messages || null;
}

/**
 * Get conversations for a user using indexer
 * More efficient than view functions
 */
export async function getConversationsFromIndexer(userAddress: string): Promise<any[] | null> {
    const query = `
        query GetConversations($userAddress: String!) {
            conversations(
                where: {user_address: {_eq: $userAddress}}
                order_by: [{last_message_timestamp: desc}]
            ) {
                id
                user_address
                other_party
                other_party_username
                last_message_timestamp
                unread_count
            }
        }
    `;

    const variables = {
        userAddress,
    };

    console.log('Fetching conversations from indexer:', userAddress);
    const result = await queryIndexer<{ conversations: any[] }>(query, variables);
    return result?.conversations || null;
}

/**
 * Get recent community messages using indexer
 * Read-only - no transaction needed
 */
export async function getRecentMessagesFromIndexer(limit: number = 50): Promise<any[] | null> {
    const query = `
        query GetRecentMessages($limit: Int!) {
            messages(
                order_by: [{timestamp: desc}]
                limit: $limit
                where: {is_deleted: {_neq: true}}
            ) {
                id
                sender
                sender_username
                content
                is_anonymous
                timestamp
            }
        }
    `;

    const variables = { limit };

    console.log('Fetching recent messages from indexer');
    const result = await queryIndexer<{ messages: any[] }>(query, variables);
    return result?.messages || null;
}

/**
 * Get user profile using indexer
 * Faster than on-chain view function
 */
export async function getProfileFromIndexer(userAddress: string): Promise<any | null> {
    const query = `
        query GetProfile($userAddress: String!) {
            profiles(where: {address: {_eq: $userAddress}}) {
                address
                username
                twitter
                pfp
                sent
                received
                status
            }
        }
    `;

    const variables = { userAddress };

    console.log('Fetching profile from indexer:', userAddress);
    const result = await queryIndexer<{ profiles: any[] }>(query, variables);
    return result?.profiles?.[0] || null;
}

/**
 * Get top profiles for leaderboard
 */
export async function getTopProfilesFromIndexer(limit: number = 20): Promise<any[] | null> {
    const query = `
        query GetTopProfiles($limit: Int!) {
            profiles(
                order_by: [{received: desc}]
                limit: $limit
            ) {
                address
                username
                twitter
                pfp
                sent
                received
                status
            }
        }
    `;

    const variables = { limit };

    console.log('Fetching top profiles from indexer');
    const result = await queryIndexer<{ profiles: any[] }>(query, variables);
    return result?.profiles || null;
}

/**
 * Subscribe to new messages (optional - uses GraphQL subscriptions)
 * Real-time updates without polling
 */
export async function subscribeToMessages(): Promise<() => void> {
    // This would require WebSocket support
    // For now, returning a no-op unsubscribe function
    console.log('Message subscription would use WebSocket connections');
    return () => { };
}
