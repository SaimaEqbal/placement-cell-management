CREATE TABLE company_post_attachments (
    attachment_id BIGSERIAL PRIMARY KEY,

    post_id BIGINT NOT NULL
        REFERENCES company_posts(post_id)
        ON DELETE CASCADE,

    file_name VARCHAR(255),

    mime_type VARCHAR(100),

    file_url TEXT NOT NULL,

    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);