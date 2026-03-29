#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, String};

/// Stores one material recommendation record
#[contracttype]
#[derive(Clone)]
pub struct RecommendationRecord {
    pub plan_hash: String, // SHA256 of the floor plan image
    pub top_material: String, // e.g. "Red Brick"
    pub element_type: String, // e.g. "load_bearing_wall"
    pub score: i64, // score × 1000 (e.g. 0.74 → 740)
    pub has_structural_concern: bool,
    pub timestamp: u64, // ledger timestamp
}

#[contract]
pub struct ASISRegistry;

#[contractimpl]
impl ASISRegistry {
    /// Store a recommendation record on-chain
    pub fn store_recommendation(
        env: Env,
        plan_hash: String,
        top_material: String,
        element_type: String,
        score: i64,
        has_structural_concern: bool,
    ) -> String {
        let record = RecommendationRecord {
            plan_hash: plan_hash.clone(),
            top_material,
            element_type,
            score,
            has_structural_concern,
            timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&plan_hash, &record);
        plan_hash // return the key for frontend to display
    }

    /// Retrieve a stored recommendation by plan hash
    pub fn get_recommendation(env: Env, plan_hash: String) -> Option<RecommendationRecord> {
        env.storage().persistent().get(&plan_hash)
    }

    /// Check if a plan has been analyzed before
    pub fn plan_exists(env: Env, plan_hash: String) -> bool {
        env.storage().persistent().has(&plan_hash)
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_store_and_retrieve() {
        let env = Env::default();
        let contract_id = env.register(ASISRegistry, ());
        let client = ASISRegistryClient::new(&env, &contract_id);

        let plan_hash = String::from_str(&env, "abc123def456");
        let material = String::from_str(&env, "Red Brick");
        let elem_type = String::from_str(&env, "load_bearing_wall");

        client.store_recommendation(&plan_hash, &material, &elem_type, &740, &false);

        let record = client.get_recommendation(&plan_hash).unwrap();
        assert_eq!(record.score, 740);
    }
}
