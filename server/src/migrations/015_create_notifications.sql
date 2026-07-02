CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    tone VARCHAR(20) NOT NULL DEFAULT 'blue'
        CHECK (tone IN ('green', 'amber', 'red', 'blue', 'gray')),

    read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, read);
