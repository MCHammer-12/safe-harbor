-- ######################################################
-- PROJECT: Lighthouse Case Management System
-- PURPOSE: Local Development Baseline Schema
-- DATABASE: PostgreSQL
-- ######################################################

-- PHASE 1: INDEPENDENT FOUNDATIONS
-- ------------------------------------------------------

CREATE TABLE safehouses (
    safehouse_id INTEGER PRIMARY KEY,
    safehouse_code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(50),
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(50) DEFAULT 'Philippines',
    open_date DATE,
    status VARCHAR(20),
    capacity_girls INTEGER,
    capacity_staff INTEGER,
    current_occupancy INTEGER,
    notes TEXT
);

CREATE TABLE partners (
    partner_id INTEGER PRIMARY KEY,
    partner_name VARCHAR(255) NOT NULL,
    partner_type VARCHAR(50),
    role_type VARCHAR(50),
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    region VARCHAR(50),
    status VARCHAR(20),
    start_date DATE,
    end_date DATE,
    notes TEXT
);

CREATE TABLE supporters (
    supporter_id INTEGER PRIMARY KEY,
    supporter_type VARCHAR(50),
    display_name VARCHAR(255),
    organization_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    relationship_type VARCHAR(50),
    region VARCHAR(100),
    country VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(20),
    created_at TIMESTAMP, -- Position 13 per CSV
    first_donation_date DATE,
    acquisition_channel VARCHAR(50)
);

CREATE TABLE social_media_posts (
    post_id INTEGER PRIMARY KEY,
    platform VARCHAR(50),
    platform_post_id VARCHAR(100),
    post_url TEXT,
    created_at TIMESTAMP,
    day_of_week VARCHAR(15),
    post_hour INTEGER,
    post_type VARCHAR(50),
    media_type VARCHAR(50),
    caption TEXT,
    hashtags TEXT,
    num_hashtags INTEGER,
    mentions_count INTEGER,
    has_call_to_action BOOLEAN,
    call_to_action_type VARCHAR(50),
    content_topic VARCHAR(50),
    sentiment_tone VARCHAR(50),
    caption_length INTEGER,
    features_resident_story BOOLEAN,
    campaign_name VARCHAR(255),
    is_boosted BOOLEAN,
    boost_budget_php NUMERIC(15,2),
    impressions NUMERIC,
    reach NUMERIC,
    likes NUMERIC,
    comments NUMERIC,
    shares NUMERIC,
    saves NUMERIC,
    click_throughs NUMERIC,
    video_views NUMERIC,
    engagement_rate NUMERIC(10,6),
    profile_visits NUMERIC,
    donation_referrals NUMERIC,
    estimated_donation_value_php NUMERIC(15,2),
    follower_count_at_post NUMERIC,
    watch_time_seconds NUMERIC,
    avg_view_duration_seconds NUMERIC,
    subscriber_count_at_post NUMERIC,
    forwards NUMERIC -- Handles decimals from CSV
);

-- PHASE 2: THE CORE SUBJECT (RESIDENTS)
-- ------------------------------------------------------

CREATE TABLE residents (
    resident_id INTEGER PRIMARY KEY,
    case_control_no VARCHAR(50) UNIQUE,
    internal_code VARCHAR(50) UNIQUE,
    safehouse_id INTEGER REFERENCES safehouses(safehouse_id),
    case_status VARCHAR(20),
    sex CHAR(1) DEFAULT 'F',
    date_of_birth DATE,
    birth_status VARCHAR(50),
    place_of_birth VARCHAR(255),
    religion VARCHAR(100),
    case_category VARCHAR(50),
    sub_cat_orphaned BOOLEAN,
    sub_cat_trafficked BOOLEAN,
    sub_cat_child_labor BOOLEAN,
    sub_cat_physical_abuse BOOLEAN,
    sub_cat_sexual_abuse BOOLEAN,
    sub_cat_osaec BOOLEAN,
    sub_cat_cicl BOOLEAN,
    sub_cat_at_risk BOOLEAN,
    sub_cat_street_child BOOLEAN,
    sub_cat_child_with_hiv BOOLEAN,
    is_pwd BOOLEAN,
    pwd_type VARCHAR(100),
    has_special_needs BOOLEAN,
    special_needs_diagnosis TEXT,
    family_is_4ps BOOLEAN,
    family_solo_parent BOOLEAN,
    family_indigenous BOOLEAN,
    family_parent_pwd BOOLEAN,
    family_informal_settler BOOLEAN,
    date_of_admission DATE,
    age_upon_admission VARCHAR(50),
    present_age VARCHAR(50),
    length_of_stay VARCHAR(50),
    referral_source VARCHAR(100),
    referring_agency_person VARCHAR(255),
    date_colb_registered DATE,
    date_colb_obtained DATE,
    assigned_social_worker VARCHAR(255),
    initial_case_assessment TEXT,
    date_case_study_prepared DATE,
    reintegration_type VARCHAR(50),
    reintegration_status VARCHAR(50),
    initial_risk_level VARCHAR(20),
    current_risk_level VARCHAR(20),
    date_enrolled DATE,
    date_closed DATE,
    created_at TIMESTAMP,
    notes_restricted TEXT
);

-- PHASE 3: CLINICAL LOGS & RESIDENT ACTIVITY
-- ------------------------------------------------------

CREATE TABLE partner_assignments (
    assignment_id INTEGER PRIMARY KEY,
    partner_id INTEGER REFERENCES partners(partner_id),
    safehouse_id INTEGER REFERENCES safehouses(safehouse_id),
    program_area VARCHAR(50),
    assignment_start DATE,
    assignment_end DATE,
    responsibility_notes TEXT,
    is_primary BOOLEAN,
    status VARCHAR(20)
);

CREATE TABLE process_recordings (
    recording_id INTEGER PRIMARY KEY,
    resident_id INTEGER REFERENCES residents(resident_id),
    session_date DATE,
    social_worker VARCHAR(255),
    session_type VARCHAR(20),
    session_duration_minutes INTEGER,
    emotional_state_observed VARCHAR(50),
    emotional_state_end VARCHAR(50),
    session_narrative TEXT,
    interventions_applied TEXT,
    follow_up_actions TEXT,
    progress_noted BOOLEAN,
    concerns_flagged BOOLEAN,
    referral_made BOOLEAN,
    notes_restricted TEXT
);

CREATE TABLE home_visitations (
    visitation_id INTEGER PRIMARY KEY,
    resident_id INTEGER REFERENCES residents(resident_id),
    visit_date DATE,
    social_worker VARCHAR(255),
    visit_type VARCHAR(50),
    location_visited TEXT,
    family_members_present TEXT,
    purpose TEXT,
    observations TEXT,
    family_cooperation_level VARCHAR(50),
    safety_concerns_noted BOOLEAN,
    follow_up_needed BOOLEAN,
    follow_up_notes TEXT,
    visit_outcome VARCHAR(50)
);

CREATE TABLE education_records (
    education_record_id INTEGER PRIMARY KEY,
    resident_id INTEGER REFERENCES residents(resident_id),
    record_date DATE,
    education_level VARCHAR(50),
    school_name VARCHAR(255),
    enrollment_status VARCHAR(50),
    attendance_rate NUMERIC(3,2),
    progress_percent NUMERIC(5,2),
    completion_status VARCHAR(20),
    notes TEXT
);

CREATE TABLE health_wellbeing_records (
    health_record_id INTEGER PRIMARY KEY,
    resident_id INTEGER REFERENCES residents(resident_id),
    record_date DATE,
    general_health_score NUMERIC(3,2),
    nutrition_score NUMERIC(3,2),
    sleep_quality_score NUMERIC(3,2),
    energy_level_score NUMERIC(3,2),
    height_cm NUMERIC(6,2),
    weight_kg NUMERIC(6,2),
    bmi NUMERIC(5,2),
    medical_checkup_done BOOLEAN,
    dental_checkup_done BOOLEAN,
    psychological_checkup_done BOOLEAN,
    notes TEXT
);

CREATE TABLE intervention_plans (
    plan_id INTEGER PRIMARY KEY,
    resident_id INTEGER REFERENCES residents(resident_id),
    plan_category VARCHAR(50),
    plan_description TEXT,
    services_provided TEXT,
    target_value NUMERIC(15,2),
    target_date DATE,
    status VARCHAR(20),
    case_conference_date DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE incident_reports (
    incident_id INTEGER PRIMARY KEY,
    resident_id INTEGER REFERENCES residents(resident_id),
    safehouse_id INTEGER REFERENCES safehouses(safehouse_id),
    incident_date DATE,
    incident_type VARCHAR(50),
    severity VARCHAR(20),
    description TEXT,
    response_taken TEXT,
    resolved BOOLEAN,
    resolution_date DATE,
    reported_by VARCHAR(255),
    follow_up_required BOOLEAN
);

-- PHASE 4: FINANCIALS & AGGREGATES
-- ------------------------------------------------------

CREATE TABLE donations (
    donation_id INTEGER PRIMARY KEY,
    supporter_id INTEGER REFERENCES supporters(supporter_id),
    donation_type VARCHAR(50),
    donation_date DATE,
    is_recurring BOOLEAN,
    campaign_name VARCHAR(255),
    channel_source VARCHAR(50),
    currency_code CHAR(3),
    amount NUMERIC(15,2),
    estimated_value NUMERIC(15,2),
    impact_unit VARCHAR(50),
    notes TEXT,
    referral_post_id INTEGER REFERENCES social_media_posts(post_id)
);

CREATE TABLE in_kind_donation_items (
    item_id INTEGER PRIMARY KEY,
    donation_id INTEGER REFERENCES donations(donation_id),
    item_name VARCHAR(255),
    item_category VARCHAR(50),
    quantity INTEGER,
    unit_of_measure VARCHAR(20),
    estimated_unit_value NUMERIC(15,2),
    intended_use VARCHAR(100),
    received_condition VARCHAR(50)
);

CREATE TABLE donation_allocations (
    allocation_id INTEGER PRIMARY KEY,
    donation_id INTEGER REFERENCES donations(donation_id),
    safehouse_id INTEGER REFERENCES safehouses(safehouse_id),
    program_area VARCHAR(50),
    amount_allocated NUMERIC(15,2),
    allocation_date DATE,
    allocation_notes TEXT
);

CREATE TABLE safehouse_monthly_metrics (
    metric_id INTEGER PRIMARY KEY,
    safehouse_id INTEGER REFERENCES safehouses(safehouse_id),
    month_start DATE,
    month_end DATE,
    active_residents INTEGER,
    avg_education_progress NUMERIC(5,2),
    avg_health_score NUMERIC(3,2),
    process_recording_count INTEGER,
    home_visitation_count INTEGER,
    incident_count INTEGER,
    notes TEXT
);

CREATE TABLE public_impact_snapshots (
    snapshot_id INTEGER PRIMARY KEY,
    snapshot_date DATE,
    headline VARCHAR(255),
    summary_text TEXT,
    metric_payload_json JSONB,
    is_published BOOLEAN,
    published_at DATE
);
