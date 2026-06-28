CREATE TABLE company_posts (
    post_id BIGSERIAL PRIMARY KEY,

    title VARCHAR(255) NOT NULL,

    post_type VARCHAR(20) 
        CHECK (post_type IN ('announcement', 'email')),

    content TEXT NOT NULL,

    posted_by UUID NOT NULL
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()
);