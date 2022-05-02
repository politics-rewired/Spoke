export enum messaging_service_type {
  'Twilio' = 'twilio',
  'AssembleNumbers' = 'assemble-numbers' 
}

export enum texter_status {
  'DoNotApprove' = 'do_not_approve',
  'ApprovalRequired' = 'approval_required',
  'AutoApprove' = 'auto_approve' 
}

export interface all_external_sync_question_response_configuration { 
  id: string
  campaign_id: number
  interaction_step_id: number
  question_response_value: string
  created_at: Date
  updated_at: Date
  system_id?: string | null 
}

export interface all_question_response { 
  id: number
  campaign_contact_id: number
  interaction_step_id: number
  value: string
  created_at: Date
  is_deleted?: boolean | null
  updated_at?: Date | null 
}

export interface all_tag { 
  id: number
  organization_id: number
  title: string
  description: string
  text_color: string
  background_color: string
  author_id?: number | null
  confirmation_steps: string[]
  on_apply_script: string
  webhook_url: string
  is_assignable: boolean
  is_system: boolean
  created_at: Date
  updated_at?: Date | null
  deleted_at?: Date | null 
}

export interface assignable_campaign_contacts { 
  id?: number | null
  campaign_id?: number | null
  message_status?: string | null
  texting_hours_end?: number | null
  contact_timezone?: string | null 
}

export interface assignable_campaign_contacts_with_escalation_tags { 
  id?: number | null
  campaign_id?: number | null
  message_status?: string | null
  contact_timezone?: string | null
  applied_escalation_tags?: number[] | null 
}

export interface assignable_campaigns { 
  id?: number | null
  title?: string | null
  organization_id?: number | null
  limit_assignment_to_teams?: boolean | null 
}

export interface assignable_campaigns_with_needs_message { 
  id?: number | null
  title?: string | null
  organization_id?: number | null
  limit_assignment_to_teams?: boolean | null 
}

export interface assignable_campaigns_with_needs_reply { 
  id?: number | null
  title?: string | null
  organization_id?: number | null
  limit_assignment_to_teams?: boolean | null 
}

export interface assignable_needs_message { 
  id?: number | null
  campaign_id?: number | null
  message_status?: string | null 
}

export interface assignable_needs_reply { 
  id?: number | null
  campaign_id?: number | null
  message_status?: string | null 
}

export interface assignable_needs_reply_with_escalation_tags { 
  id?: number | null
  campaign_id?: number | null
  message_status?: string | null
  applied_escalation_tags?: number[] | null 
}

export interface assignment { 
  id: number
  user_id: number
  campaign_id: number
  created_at: Date
  max_contacts?: number | null
  updated_at?: Date | null 
}

export interface assignment_request { 
  id: number
  created_at: Date
  updated_at: Date
  organization_id?: number | null
  status?: string | null
  user_id: number
  amount: number
  approved_by_user_id?: number | null
  preferred_team_id?: number | null 
}

export interface campaign { 
  id: number
  organization_id: number
  title: string
  description: string
  is_started?: boolean | null
  due_by?: Date | null
  created_at: Date
  is_archived?: boolean | null
  use_dynamic_assignment?: boolean | null
  logo_image_url?: string | null
  intro_html?: string | null
  primary_color?: string | null
  texting_hours_start?: number | null
  texting_hours_end?: number | null
  timezone?: string | null
  creator_id?: number | null
  is_autoassign_enabled: boolean
  limit_assignment_to_teams: boolean
  updated_at?: Date | null
  replies_stale_after_minutes?: number | null
  landlines_filtered?: boolean | null
  external_system_id?: string | null
  is_approved?: boolean | null
  autosend_status?: string | null
  autosend_user_id?: number | null 
}

export interface campaign_contact { 
  id: number
  campaign_id: number
  assignment_id?: number | null
  external_id: string
  first_name: string
  last_name: string
  cell: string
  zip: string
  custom_fields: string
  created_at: Date
  updated_at: Date
  message_status: string
  is_opted_out?: boolean | null
  timezone?: string | null
  archived?: boolean | null 
}

export interface campaign_contact_tag { 
  campaign_contact_id: number
  tag_id: number
  tagger_id: number
  created_at: Date
  updated_at?: Date | null 
}

export interface campaign_group { 
  id: number
  organization_id: number
  name: string
  description: string
  created_at: Date
  updated_at: Date 
}

export interface campaign_group_campaign { 
  id: number
  campaign_group_id: number
  campaign_id: number
  created_at: Date
  updated_at: Date 
}

export interface campaign_team { 
  campaign_id?: number | null
  team_id?: number | null
  created_at: Date
  updated_at?: Date | null
  id: number 
}

export interface campaign_with_groups { 
  id?: number | null
  organization_id?: number | null
  title?: string | null
  description?: string | null
  is_started?: boolean | null
  due_by?: Date | null
  created_at?: Date | null
  is_archived?: boolean | null
  use_dynamic_assignment?: boolean | null
  logo_image_url?: string | null
  intro_html?: string | null
  primary_color?: string | null
  texting_hours_start?: number | null
  texting_hours_end?: number | null
  timezone?: string | null
  creator_id?: number | null
  is_autoassign_enabled?: boolean | null
  limit_assignment_to_teams?: boolean | null
  updated_at?: Date | null
  replies_stale_after_minutes?: number | null
  landlines_filtered?: boolean | null
  external_system_id?: string | null
  group_name?: string | null
  group_description?: string | null 
}

export interface canned_response { 
  id: number
  campaign_id: number
  text: string
  title: string
  user_id?: number | null
  created_at: Date
  updated_at?: Date | null 
}

export interface deliverability_report { 
  id: number
  period_starts_at?: Date | null
  period_ends_at?: Date | null
  computed_at?: Date | null
  count_total?: number | null
  count_delivered?: number | null
  count_sent?: number | null
  count_error?: number | null
  domain?: string | null
  url_path?: string | null 
}

export interface external_activist_code { 
  id: string
  system_id: string
  external_id: number
  type?: string | null
  name?: string | null
  medium_name?: string | null
  short_name?: string | null
  description?: string | null
  script_question?: string | null
  status?: string | null
  created_at: Date
  updated_at: Date 
}

export interface external_list { 
  system_id: string
  external_id: number
  name: string
  description: string
  list_count: number
  door_count: number
  created_at: Date
  updated_at: Date 
}

export interface external_result_code { 
  id: string
  system_id: string
  external_id: number
  name?: string | null
  medium_name?: string | null
  short_name?: string | null
  created_at: Date
  updated_at: Date 
}

export interface external_survey_question { 
  id: string
  system_id: string
  external_id: number
  type?: string | null
  cycle?: number | null
  name?: string | null
  medium_name?: string | null
  short_name?: string | null
  script_question?: string | null
  status?: string | null
  created_at: Date
  updated_at: Date 
}

export interface external_survey_question_response_option { 
  id: string
  external_survey_question_id: string
  external_id: number
  name?: string | null
  medium_name?: string | null
  short_name?: string | null
  created_at: Date
  updated_at: Date 
}

export interface external_sync_config_question_response_activist_code { 
  id: string
  question_response_config_id: string
  external_activist_code_id: string 
}

export interface external_sync_config_question_response_response_option { 
  id: string
  question_response_config_id: string
  external_response_option_id: string 
}

export interface external_sync_config_question_response_result_code { 
  id: string
  question_response_config_id: string
  external_result_code_id: string 
}

export interface external_sync_opt_out_configuration { 
  id: string
  system_id: string
  external_result_code_id: string
  created_at: Date
  updated_at: Date 
}

export interface external_sync_question_response_configuration { 
  compound_id?: string | null
  campaign_id?: number | null
  system_id?: string | null
  interaction_step_id?: number | null
  question_response_value?: string | null
  created_at?: Date | null
  updated_at?: Date | null
  is_empty?: boolean | null
  includes_not_active?: boolean | null
  is_missing?: boolean | null
  is_required?: boolean | null 
}

export interface external_system { 
  id: string
  name: string
  type: string
  api_key_ref: string
  organization_id?: number | null
  username: string
  created_at: Date
  updated_at: Date
  synced_at?: Date | null 
}

export interface instance_setting { 
  name: string
  type?: string | null
  value: string 
}

export interface interaction_step { 
  id: number
  campaign_id: number
  question: string
  created_at: Date
  parent_interaction_id?: number | null
  answer_option: string
  answer_actions: string
  is_deleted: boolean
  script_options: string[]
  updated_at?: Date | null 
}

export interface invite { 
  id: number
  is_valid: boolean
  hash?: string | null
  created_at: Date
  updated_at?: Date | null
  payload: unknown 
}

export interface job_request { 
  id: number
  campaign_id: number
  payload: string
  queue_name: string
  job_type: string
  result_message?: string | null
  locks_queue?: boolean | null
  assigned?: boolean | null
  status?: number | null
  updated_at: Date
  created_at: Date 
}

export interface knex_migrations { 
  id: number
  name?: string | null
  batch?: number | null
  migration_time?: Date | null 
}

export interface knex_migrations_lock { 
  index: number
  is_locked?: number | null 
}

export interface link_domain { 
  id: number
  organization_id: number
  domain: string
  max_usage_count: number
  current_usage_count: number
  is_manually_disabled: boolean
  cycled_out_at: Date
  created_at: Date
  updated_at?: Date | null 
}

export interface log { 
  id: number
  message_sid: string
  body?: string | null
  created_at: Date
  updated_at?: Date | null
  service_type?: messaging_service_type | null 
}

export interface message { 
  id: number
  user_number: string
  user_id?: number | null
  contact_number: string
  is_from_contact: boolean
  text: string
  service_response?: string | null
  assignment_id: number
  service: string
  service_id: string
  send_status: string
  created_at: Date
  queued_at: Date
  sent_at: Date
  service_response_at: Date
  send_before: Date
  campaign_contact_id?: number | null
  updated_at?: Date | null
  script_version_hash?: string | null
  num_segments?: number | null
  num_media?: number | null
  error_codes?: string[] | null 
}

export interface messaging_service { 
  messaging_service_sid: string
  organization_id?: number | null
  account_sid: string
  encrypted_auth_token: string
  updated_at?: Date | null
  service_type: messaging_service_type 
}

export interface messaging_service_stick { 
  cell: string
  organization_id: number
  messaging_service_sid: string
  updated_at?: Date | null 
}

export interface missing_external_sync_question_response_configuration { 
  campaign_id?: number | null
  interaction_step_id?: number | null
  value?: string | null
  is_required?: boolean | null
  system_id?: string | null 
}

export interface monthly_organization_message_usages { 
  month: Date
  organization_id: number
  sent_message_count?: number | null 
}

export interface notification { 
  id: number
  user_id: number
  subject: string
  content: string
  reply_to?: string | null
  sent_at?: Date | null
  created_at: Date
  updated_at: Date 
}

export interface opt_out { 
  id: number
  cell: string
  assignment_id: number
  organization_id: number
  reason_code: string
  created_at: Date
  updated_at?: Date | null 
}

export interface organization { 
  id: number
  uuid?: string | null
  name: string
  created_at: Date
  features?: string | null
  texting_hours_enforced?: boolean | null
  texting_hours_start?: number | null
  texting_hours_end?: number | null
  updated_at?: Date | null
  monthly_message_limit?: number | null 
}

export interface password_reset_request { 
  id: number
  email?: string | null
  token?: string | null
  used_at?: Date | null
  created_at?: Date | null
  updated_at?: Date | null
  expires_at?: Date | null 
}

export interface pending_message_part { 
  id: number
  service: string
  service_id: string
  parent_id?: string | null
  service_message: string
  user_number: string
  contact_number: string
  created_at: Date 
}

export interface question_response { 
  id?: number | null
  campaign_contact_id?: number | null
  interaction_step_id?: number | null
  value?: string | null
  created_at?: Date | null
  is_deleted?: boolean | null
  updated_at?: Date | null 
}

export interface tag { 
  id?: number | null
  organization_id?: number | null
  title?: string | null
  description?: string | null
  text_color?: string | null
  background_color?: string | null
  author_id?: number | null
  confirmation_steps?: string[] | null
  on_apply_script?: string | null
  webhook_url?: string | null
  is_assignable?: boolean | null
  is_system?: boolean | null
  created_at?: Date | null
  updated_at?: Date | null
  deleted_at?: Date | null 
}

export interface team { 
  id: number
  organization_id: number
  title: string
  description: string
  text_color: string
  background_color: string
  assignment_priority?: number | null
  author_id?: number | null
  created_at: Date
  is_assignment_enabled?: boolean | null
  assignment_type?: string | null
  max_request_count?: number | null
  updated_at?: Date | null 
}

export interface team_escalation_tags { 
  team_id?: number | null
  tag_id?: number | null
  created_at?: Date | null
  updated_at?: Date | null
  id: number 
}

export interface troll_alarm { 
  message_id: number
  trigger_token: string
  dismissed?: boolean | null
  organization_id: number 
}

export interface troll_trigger { 
  token: string
  organization_id: number
  mode: string
  compiled_tsquery?: any | null 
}

export interface unhealthy_link_domain { 
  id: number
  domain: string
  created_at: Date
  healthy_again_at?: Date | null
  updated_at?: Date | null 
}

export interface unsolicited_message { 
  id: number
  messaging_service_sid: string
  service_id: string
  from_number: string
  body: string
  num_segments: number
  num_media: number
  media_urls: string[]
  service_response: unknown
  created_at: Date
  updated_at: Date 
}

export interface user { 
  id: number
  auth0_id: string
  first_name: string
  last_name: string
  cell: string
  email: string
  created_at: Date
  assigned_cell?: string | null
  is_superadmin?: boolean | null
  terms?: boolean | null
  updated_at?: Date | null
  is_suspended: boolean 
}

export interface user_cell { 
  id: number
  cell: string
  user_id: number
  service?: string | null
  is_primary?: boolean | null 
}

export interface user_organization { 
  id: number
  user_id: number
  organization_id: number
  role: string
  updated_at?: Date | null
  request_status: texter_status 
}

export interface user_session { 
  sid: string
  sess: unknown
  expire: Date
  user_id?: number | null 
}

export interface user_team { 
  user_id?: number | null
  team_id?: number | null
  created_at: Date
  updated_at?: Date | null
  id: number 
}

export interface v_troll_trigger { 
  to_tsquery?: any | null 
}

export interface zip_code { 
  zip: string
  city: string
  state: string
  latitude: number
  longitude: number
  timezone_offset: number
  has_dst: boolean 
}

export interface Tables {
  all_external_sync_question_response_configuration: all_external_sync_question_response_configuration,
  all_question_response: all_question_response,
  all_tag: all_tag,
  assignable_campaign_contacts: assignable_campaign_contacts,
  assignable_campaign_contacts_with_escalation_tags: assignable_campaign_contacts_with_escalation_tags,
  assignable_campaigns: assignable_campaigns,
  assignable_campaigns_with_needs_message: assignable_campaigns_with_needs_message,
  assignable_campaigns_with_needs_reply: assignable_campaigns_with_needs_reply,
  assignable_needs_message: assignable_needs_message,
  assignable_needs_reply: assignable_needs_reply,
  assignable_needs_reply_with_escalation_tags: assignable_needs_reply_with_escalation_tags,
  assignment: assignment,
  assignment_request: assignment_request,
  campaign: campaign,
  campaign_contact: campaign_contact,
  campaign_contact_tag: campaign_contact_tag,
  campaign_group: campaign_group,
  campaign_group_campaign: campaign_group_campaign,
  campaign_team: campaign_team,
  campaign_with_groups: campaign_with_groups,
  canned_response: canned_response,
  deliverability_report: deliverability_report,
  external_activist_code: external_activist_code,
  external_list: external_list,
  external_result_code: external_result_code,
  external_survey_question: external_survey_question,
  external_survey_question_response_option: external_survey_question_response_option,
  external_sync_config_question_response_activist_code: external_sync_config_question_response_activist_code,
  external_sync_config_question_response_response_option: external_sync_config_question_response_response_option,
  external_sync_config_question_response_result_code: external_sync_config_question_response_result_code,
  external_sync_opt_out_configuration: external_sync_opt_out_configuration,
  external_sync_question_response_configuration: external_sync_question_response_configuration,
  external_system: external_system,
  instance_setting: instance_setting,
  interaction_step: interaction_step,
  invite: invite,
  job_request: job_request,
  knex_migrations: knex_migrations,
  knex_migrations_lock: knex_migrations_lock,
  link_domain: link_domain,
  log: log,
  message: message,
  messaging_service: messaging_service,
  messaging_service_stick: messaging_service_stick,
  missing_external_sync_question_response_configuration: missing_external_sync_question_response_configuration,
  monthly_organization_message_usages: monthly_organization_message_usages,
  notification: notification,
  opt_out: opt_out,
  organization: organization,
  password_reset_request: password_reset_request,
  pending_message_part: pending_message_part,
  question_response: question_response,
  tag: tag,
  team: team,
  team_escalation_tags: team_escalation_tags,
  troll_alarm: troll_alarm,
  troll_trigger: troll_trigger,
  unhealthy_link_domain: unhealthy_link_domain,
  unsolicited_message: unsolicited_message,
  user: user,
  user_cell: user_cell,
  user_organization: user_organization,
  user_session: user_session,
  user_team: user_team,
  v_troll_trigger: v_troll_trigger,
  zip_code: zip_code
}