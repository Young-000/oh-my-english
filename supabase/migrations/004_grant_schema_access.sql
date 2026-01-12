-- Grant schema access to PostgREST roles
-- This allows the API to access tables in oh_my_english schema

-- Grant usage on the schema
GRANT USAGE ON SCHEMA oh_my_english TO anon;
GRANT USAGE ON SCHEMA oh_my_english TO authenticated;
GRANT USAGE ON SCHEMA oh_my_english TO service_role;

-- Grant access to vocabulary tables
GRANT SELECT ON oh_my_english.vocabulary_books TO anon;
GRANT SELECT ON oh_my_english.vocabulary_items TO anon;
GRANT ALL ON oh_my_english.vocabulary_books TO authenticated;
GRANT ALL ON oh_my_english.vocabulary_items TO authenticated;
GRANT ALL ON oh_my_english.vocabulary_progress TO authenticated;
GRANT ALL ON oh_my_english.vocabulary_books TO service_role;
GRANT ALL ON oh_my_english.vocabulary_items TO service_role;
GRANT ALL ON oh_my_english.vocabulary_progress TO service_role;

-- Grant access to other tables in the schema
GRANT ALL ON oh_my_english.profiles TO authenticated;
GRANT ALL ON oh_my_english.learning_records TO authenticated;
GRANT ALL ON oh_my_english.quiz_attempts TO authenticated;
GRANT ALL ON oh_my_english.daily_stats TO authenticated;
GRANT ALL ON oh_my_english.translation_cache TO anon;
GRANT ALL ON oh_my_english.translation_cache TO authenticated;
GRANT ALL ON oh_my_english.translation_cache TO service_role;
GRANT ALL ON oh_my_english.profiles TO service_role;
GRANT ALL ON oh_my_english.learning_records TO service_role;
GRANT ALL ON oh_my_english.quiz_attempts TO service_role;
GRANT ALL ON oh_my_english.daily_stats TO service_role;
