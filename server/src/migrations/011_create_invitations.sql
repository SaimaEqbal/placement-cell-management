CREATE TABLE invitations (
    invitation_id SERIAL PRIMARY KEY,

    email VARCHAR(255) UNIQUE NOT NULL,

    role VARCHAR(20) NOT NULL,

    token UUID NOT NULL UNIQUE,

    accepted BOOLEAN DEFAULT FALSE,

    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);