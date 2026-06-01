export type AssessmentsMode = 'empty' | 'registered' | 'analyzing' | 'analyzed';

export type PsychologyDebugScenario =
  | 'server'
  | 'no_client'
  | 'initial_loading'
  | 'empty'
  | 'registered_ready'
  | 'registered_reviewing'
  | 'registered_needs_review'
  | 'analysis_error'
  | 'analyzing'
  | 'analyzed_empty'
  | 'chat_sending'
  | 'analyzed_chat'
  | 'chat_failed'
  | 'chat_retrying';

export type RegisterModalDebugPreset =
  | 'upload_empty'
  | 'upload_files_ready'
  | 'upload_missing_type'
  | 'upload_duplicate_kind'
  | 'uploading'
  | 'upload_failed'
  | 'cleanup_needed'
  | 'reviewing'
  | 'verify_complete'
  | 'verify_missing'
  | 'verify_filling'
  | 'verify_confirm_error'
  | 'verify_invalid'
  | 'verify_failed'
  | 'complete'
  | 'complete_analysis_error';
