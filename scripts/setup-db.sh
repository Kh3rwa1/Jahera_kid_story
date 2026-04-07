#!/bin/bash
# Recreate the Jahera database and all collections in Appwrite
set -e

echo "=== Creating Database ==="
appwrite databases create --database-id jahera_db --name "Jahera Database"

echo ""
echo "=== Creating Collections ==="

# 1. profiles
echo "Creating: profiles"
appwrite databases create-collection \
  --database-id jahera_db \
  --collection-id profiles \
  --name "profiles" \
  --document-security

appwrite databases create-string-attribute --database-id jahera_db --collection-id profiles --key user_id --size 255 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id profiles --key kid_name --size 255 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id profiles --key primary_language --size 10 --required true
appwrite databases create-integer-attribute --database-id jahera_db --collection-id profiles --key age --required false
appwrite databases create-string-attribute --database-id jahera_db --collection-id profiles --key parent_pin --size 255 --required false
appwrite databases create-string-attribute --database-id jahera_db --collection-id profiles --key share_token --size 255 --required false
appwrite databases create-string-attribute --database-id jahera_db --collection-id profiles --key avatar_url --size 1024 --required false
appwrite databases create-string-attribute --database-id jahera_db --collection-id profiles --key elevenlabs_voice_id --size 255 --required false
appwrite databases create-string-attribute --database-id jahera_db --collection-id profiles --key elevenlabs_model_id --size 255 --required false
appwrite databases create-float-attribute --database-id jahera_db --collection-id profiles --key elevenlabs_stability --required false
appwrite databases create-float-attribute --database-id jahera_db --collection-id profiles --key elevenlabs_similarity --required false
appwrite databases create-float-attribute --database-id jahera_db --collection-id profiles --key elevenlabs_style --required false
appwrite databases create-boolean-attribute --database-id jahera_db --collection-id profiles --key elevenlabs_speaker_boost --required false
appwrite databases create-datetime-attribute --database-id jahera_db --collection-id profiles --key updated_at --required false

sleep 2
echo "Creating index: user_id on profiles"
appwrite databases create-index --database-id jahera_db --collection-id profiles --key idx_user_id --type key --attributes user_id --orders ASC

# 2. user_languages
echo ""
echo "Creating: user_languages"
appwrite databases create-collection \
  --database-id jahera_db \
  --collection-id user_languages \
  --name "user_languages" \
  --document-security

appwrite databases create-string-attribute --database-id jahera_db --collection-id user_languages --key profile_id --size 255 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id user_languages --key language_code --size 10 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id user_languages --key language_name --size 255 --required true

sleep 2
appwrite databases create-index --database-id jahera_db --collection-id user_languages --key idx_profile_id --type key --attributes profile_id --orders ASC

# 3. family_members
echo ""
echo "Creating: family_members"
appwrite databases create-collection \
  --database-id jahera_db \
  --collection-id family_members \
  --name "family_members" \
  --document-security

appwrite databases create-string-attribute --database-id jahera_db --collection-id family_members --key profile_id --size 255 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id family_members --key name --size 255 --required true

sleep 2
appwrite databases create-index --database-id jahera_db --collection-id family_members --key idx_profile_id --type key --attributes profile_id --orders ASC

# 4. friends
echo ""
echo "Creating: friends"
appwrite databases create-collection \
  --database-id jahera_db \
  --collection-id friends \
  --name "friends" \
  --document-security

appwrite databases create-string-attribute --database-id jahera_db --collection-id friends --key profile_id --size 255 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id friends --key name --size 255 --required true

sleep 2
appwrite databases create-index --database-id jahera_db --collection-id friends --key idx_profile_id --type key --attributes profile_id --orders ASC

# 5. stories
echo ""
echo "Creating: stories"
appwrite databases create-collection \
  --database-id jahera_db \
  --collection-id stories \
  --name "stories" \
  --document-security

appwrite databases create-string-attribute --database-id jahera_db --collection-id stories --key profile_id --size 255 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id stories --key language_code --size 10 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id stories --key title --size 1024 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id stories --key content --size 100000 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id stories --key audio_url --size 2048 --required false
appwrite databases create-string-attribute --database-id jahera_db --collection-id stories --key season --size 50 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id stories --key theme --size 255 --required false
appwrite databases create-string-attribute --database-id jahera_db --collection-id stories --key mood --size 255 --required false
appwrite databases create-integer-attribute --database-id jahera_db --collection-id stories --key word_count --required false
appwrite databases create-string-attribute --database-id jahera_db --collection-id stories --key share_token --size 255 --required false
appwrite databases create-integer-attribute --database-id jahera_db --collection-id stories --key like_count --required false
appwrite databases create-string-attribute --database-id jahera_db --collection-id stories --key time_of_day --size 50 --required true
appwrite databases create-datetime-attribute --database-id jahera_db --collection-id stories --key generated_at --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id stories --key location_city --size 255 --required false
appwrite databases create-string-attribute --database-id jahera_db --collection-id stories --key location_country --size 255 --required false

sleep 2
echo "Creating indexes on stories"
appwrite databases create-index --database-id jahera_db --collection-id stories --key idx_profile_id --type key --attributes profile_id --orders ASC
sleep 1
appwrite databases create-index --database-id jahera_db --collection-id stories --key idx_generated_at --type key --attributes generated_at --orders DESC

# 6. quiz_questions
echo ""
echo "Creating: quiz_questions"
appwrite databases create-collection \
  --database-id jahera_db \
  --collection-id quiz_questions \
  --name "quiz_questions" \
  --document-security

appwrite databases create-string-attribute --database-id jahera_db --collection-id quiz_questions --key story_id --size 255 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id quiz_questions --key question_text --size 2048 --required true
appwrite databases create-integer-attribute --database-id jahera_db --collection-id quiz_questions --key question_order --required true

sleep 2
appwrite databases create-index --database-id jahera_db --collection-id quiz_questions --key idx_story_id --type key --attributes story_id --orders ASC

# 7. quiz_answers
echo ""
echo "Creating: quiz_answers"
appwrite databases create-collection \
  --database-id jahera_db \
  --collection-id quiz_answers \
  --name "quiz_answers" \
  --document-security

appwrite databases create-string-attribute --database-id jahera_db --collection-id quiz_answers --key question_id --size 255 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id quiz_answers --key answer_text --size 2048 --required true
appwrite databases create-boolean-attribute --database-id jahera_db --collection-id quiz_answers --key is_correct --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id quiz_answers --key answer_order --size 10 --required true

sleep 2
appwrite databases create-index --database-id jahera_db --collection-id quiz_answers --key idx_question_id --type key --attributes question_id --orders ASC

# 8. quiz_attempts
echo ""
echo "Creating: quiz_attempts"
appwrite databases create-collection \
  --database-id jahera_db \
  --collection-id quiz_attempts \
  --name "quiz_attempts" \
  --document-security

appwrite databases create-string-attribute --database-id jahera_db --collection-id quiz_attempts --key profile_id --size 255 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id quiz_attempts --key story_id --size 255 --required true
appwrite databases create-integer-attribute --database-id jahera_db --collection-id quiz_attempts --key score --required true
appwrite databases create-integer-attribute --database-id jahera_db --collection-id quiz_attempts --key total_questions --required true
appwrite databases create-datetime-attribute --database-id jahera_db --collection-id quiz_attempts --key completed_at --required true

sleep 2
appwrite databases create-index --database-id jahera_db --collection-id quiz_attempts --key idx_profile_id --type key --attributes profile_id --orders ASC

# 9. subscriptions
echo ""
echo "Creating: subscriptions"
appwrite databases create-collection \
  --database-id jahera_db \
  --collection-id subscriptions \
  --name "subscriptions" \
  --document-security

appwrite databases create-string-attribute --database-id jahera_db --collection-id subscriptions --key profile_id --size 255 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id subscriptions --key plan --size 50 --required true
appwrite databases create-integer-attribute --database-id jahera_db --collection-id subscriptions --key stories_used_this_month --required true
appwrite databases create-integer-attribute --database-id jahera_db --collection-id subscriptions --key stories_limit --required true
appwrite databases create-datetime-attribute --database-id jahera_db --collection-id subscriptions --key billing_period_start --required true
appwrite databases create-datetime-attribute --database-id jahera_db --collection-id subscriptions --key billing_period_end --required true
appwrite databases create-boolean-attribute --database-id jahera_db --collection-id subscriptions --key is_active --required true
appwrite databases create-datetime-attribute --database-id jahera_db --collection-id subscriptions --key trial_ends_at --required false
appwrite databases create-datetime-attribute --database-id jahera_db --collection-id subscriptions --key updated_at --required false

sleep 2
appwrite databases create-index --database-id jahera_db --collection-id subscriptions --key idx_profile_id --type key --attributes profile_id --orders ASC

# 10. streaks
echo ""
echo "Creating: streaks"
appwrite databases create-collection \
  --database-id jahera_db \
  --collection-id streaks \
  --name "streaks" \
  --document-security

appwrite databases create-string-attribute --database-id jahera_db --collection-id streaks --key profile_id --size 255 --required true
appwrite databases create-integer-attribute --database-id jahera_db --collection-id streaks --key current_streak --required true
appwrite databases create-integer-attribute --database-id jahera_db --collection-id streaks --key longest_streak --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id streaks --key last_activity_date --size 50 --required false
appwrite databases create-integer-attribute --database-id jahera_db --collection-id streaks --key total_days_active --required true
appwrite databases create-datetime-attribute --database-id jahera_db --collection-id streaks --key updated_at --required false

sleep 2
appwrite databases create-index --database-id jahera_db --collection-id streaks --key idx_profile_id --type key --attributes profile_id --orders ASC

# 11. profile_interests
echo ""
echo "Creating: profile_interests"
appwrite databases create-collection \
  --database-id jahera_db \
  --collection-id profile_interests \
  --name "profile_interests" \
  --document-security

appwrite databases create-string-attribute --database-id jahera_db --collection-id profile_interests --key profile_id --size 255 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id profile_interests --key interest --size 255 --required true

sleep 2
appwrite databases create-index --database-id jahera_db --collection-id profile_interests --key idx_profile_id --type key --attributes profile_id --orders ASC

# 12. config
echo ""
echo "Creating: config"
appwrite databases create-collection \
  --database-id jahera_db \
  --collection-id config \
  --name "config" \
  --document-security

appwrite databases create-string-attribute --database-id jahera_db --collection-id config --key key --size 255 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id config --key value --size 10000 --required true

sleep 2
appwrite databases create-index --database-id jahera_db --collection-id config --key idx_key --type key --attributes key --orders ASC

# 13. api_keys
echo ""
echo "Creating: api_keys"
appwrite databases create-collection \
  --database-id jahera_db \
  --collection-id api_keys \
  --name "api_keys" \
  --document-security

appwrite databases create-string-attribute --database-id jahera_db --collection-id api_keys --key key --size 255 --required true
appwrite databases create-string-attribute --database-id jahera_db --collection-id api_keys --key value --size 2048 --required true

sleep 2
appwrite databases create-index --database-id jahera_db --collection-id api_keys --key idx_key --type key --attributes key --orders ASC

echo ""
echo "=== Setting Collection Permissions ==="
# Set read/write permissions for all authenticated users on all collections
COLLECTIONS="profiles user_languages family_members friends stories quiz_questions quiz_answers quiz_attempts subscriptions streaks profile_interests config api_keys"

for col in $COLLECTIONS; do
  echo "Setting permissions for: $col"
  appwrite databases update-collection \
    --database-id jahera_db \
    --collection-id "$col" \
    --name "$col" \
    --permissions 'read("users")' 'create("users")' 'update("users")' 'delete("users")' \
    --document-security false 2>/dev/null || echo "  (using document-level security for $col)"
done

echo ""
echo "=== Database setup complete! ==="
