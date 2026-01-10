// Contract addresses and constants for Spacely on Movement Network
export const MODULE_ADDRESS = '0xe9001a042dffbfc16b68bd3b3bbeb51efab4abded5b038d4a8f138a5b6d95988';

// Module functions
export const MODULES = {
    PROFILE: {
        CREATE_PROFILE: `${MODULE_ADDRESS}::profile::create_profile` as `${string}::${string}::${string}`,
        GET_PROFILE: `${MODULE_ADDRESS}::profile::get_profile_with_status` as `${string}::${string}::${string}`,
        GET_FULL_PROFILE: `${MODULE_ADDRESS}::profile::get_full_profile_info` as `${string}::${string}::${string}`,
        HAS_PROFILE: `${MODULE_ADDRESS}::profile::has_profile` as `${string}::${string}::${string}`,
        TRANSFER_TOKENS: `${MODULE_ADDRESS}::profile::transfer_tokens` as `${string}::${string}::${string}`,
    },
    SPACE: {
        INITIALIZE_GLOBAL: `${MODULE_ADDRESS}::space::initialize_global` as `${string}::${string}::${string}`,
        CREATE_EVENT: `${MODULE_ADDRESS}::space::create_event` as `${string}::${string}::${string}`,
        GET_ALL_EVENTS: `${MODULE_ADDRESS}::space::get_all_events` as `${string}::${string}::${string}`,
        GET_EVENTS_BY_CREATOR: `${MODULE_ADDRESS}::space::get_events_by_creator` as `${string}::${string}::${string}`,
        GET_GLOBAL_EVENT_COUNT: `${MODULE_ADDRESS}::space::get_global_event_count` as `${string}::${string}::${string}`,
        DELETE_EVENT: `${MODULE_ADDRESS}::space::delete_event` as `${string}::${string}::${string}`,
    },
    CHAT: {
        INITIALIZE_GLOBAL_CHAT: `${MODULE_ADDRESS}::chat::initialize_global_chat` as `${string}::${string}::${string}`,
        INITIALIZE_INBOX: `${MODULE_ADDRESS}::chat::initialize_inbox` as `${string}::${string}::${string}`,
        POST_MESSAGE: `${MODULE_ADDRESS}::chat::post_message` as `${string}::${string}::${string}`,
        POST_ANONYMOUS: `${MODULE_ADDRESS}::chat::post_anonymous` as `${string}::${string}::${string}`,
        SEND_DIRECT_MESSAGE: `${MODULE_ADDRESS}::chat::send_direct_message` as `${string}::${string}::${string}`,
        MARK_CONVERSATION_READ: `${MODULE_ADDRESS}::chat::mark_conversation_read` as `${string}::${string}::${string}`,
        GET_ALL_MESSAGES: `${MODULE_ADDRESS}::chat::get_all_messages` as `${string}::${string}::${string}`,
        GET_RECENT_MESSAGES: `${MODULE_ADDRESS}::chat::get_recent_messages` as `${string}::${string}::${string}`,
        GET_MESSAGE_COUNT: `${MODULE_ADDRESS}::chat::get_message_count` as `${string}::${string}::${string}`,
        GET_DIRECT_MESSAGES: `${MODULE_ADDRESS}::chat::get_direct_messages` as `${string}::${string}::${string}`,
        GET_CONVERSATION: `${MODULE_ADDRESS}::chat::get_conversation` as `${string}::${string}::${string}`,
        GET_CONVERSATIONS: `${MODULE_ADDRESS}::chat::get_conversations` as `${string}::${string}::${string}`,
        GET_UNREAD_COUNT: `${MODULE_ADDRESS}::chat::get_unread_count` as `${string}::${string}::${string}`,
        HAS_INBOX: `${MODULE_ADDRESS}::chat::has_inbox` as `${string}::${string}::${string}`,
    },
    POAP: {
        CREATE_COLLECTION: `${MODULE_ADDRESS}::poap::create_collection` as `${string}::${string}::${string}`,
        MINT_POAP: `${MODULE_ADDRESS}::poap::mint_poap` as `${string}::${string}::${string}`,
        SET_PAUSED: `${MODULE_ADDRESS}::poap::set_paused` as `${string}::${string}::${string}`,
        GET_HOLDERS: `${MODULE_ADDRESS}::poap::get_holders` as `${string}::${string}::${string}`,
        UPDATE_TIME: `${MODULE_ADDRESS}::poap::update_time` as `${string}::${string}::${string}`,
        END_MINT: `${MODULE_ADDRESS}::poap::end_mint` as `${string}::${string}::${string}`,
        INITIALIZE_MODULE: `${MODULE_ADDRESS}::poap::initialize_module` as `${string}::${string}::${string}`,
        HAS_POAP: `${MODULE_ADDRESS}::poap::has_poap` as `${string}::${string}::${string}`,
        IS_PAUSED: `${MODULE_ADDRESS}::poap::is_paused` as `${string}::${string}::${string}`,
        GET_POAP_INFO: `${MODULE_ADDRESS}::poap::get_poap_info` as `${string}::${string}::${string}`,
        VERIFY_PASSWORD: `${MODULE_ADDRESS}::poap::verify_password` as `${string}::${string}::${string}`,
    },
    UPS: {
        INITIALIZE_ACCOUNT: `${MODULE_ADDRESS}::ups::initialize_account` as `${string}::${string}::${string}`,
        CLAIM_DAILY: `${MODULE_ADDRESS}::ups::claim_daily` as `${string}::${string}::${string}`,
        SEND_UPS: `${MODULE_ADDRESS}::ups::send_ups` as `${string}::${string}::${string}`,
        GENERATE_AND_SEND_UPS: `${MODULE_ADDRESS}::ups::generate_and_send_ups` as `${string}::${string}::${string}`,
        GET_BALANCE: `${MODULE_ADDRESS}::ups::get_balance` as `${string}::${string}::${string}`,
        GET_STREAK: `${MODULE_ADDRESS}::ups::get_streak` as `${string}::${string}::${string}`,
        GET_TOTAL_CLAIMED: `${MODULE_ADDRESS}::ups::get_total_claimed` as `${string}::${string}::${string}`,
        GET_UPS_SENT: `${MODULE_ADDRESS}::ups::get_ups_sent` as `${string}::${string}::${string}`,
        GET_UPS_RECEIVED: `${MODULE_ADDRESS}::ups::get_ups_received` as `${string}::${string}::${string}`,
        GET_FULL_ACCOUNT_INFO: `${MODULE_ADDRESS}::ups::get_full_account_info` as `${string}::${string}::${string}`,
        CAN_CLAIM: `${MODULE_ADDRESS}::ups::can_claim_today` as `${string}::${string}::${string}`,
        GET_NEXT_CLAIM_AMOUNT: `${MODULE_ADDRESS}::ups::get_next_claim_amount` as `${string}::${string}::${string}`,
        GET_TIME_UNTIL_NEXT_CLAIM: `${MODULE_ADDRESS}::ups::get_time_until_next_claim` as `${string}::${string}::${string}`,
        HAS_ACCOUNT: `${MODULE_ADDRESS}::ups::has_account` as `${string}::${string}::${string}`,
        GET_LEADERBOARD: `${MODULE_ADDRESS}::ups::get_leaderboard_data` as `${string}::${string}::${string}`,
    },
};

// Network configuration
export const NETWORK_CONFIG = {
    REST_URL: 'https://testnet.movementnetwork.xyz/v1',
    INDEXER_URL: 'https://hasura.testnet.movementnetwork.xyz/v1/graphql',
    FAUCET_URL: 'https://faucet.testnet.movementnetwork.xyz/',
    EXPLORER_URL: 'https://explorer.movementnetwork.xyz',
};
