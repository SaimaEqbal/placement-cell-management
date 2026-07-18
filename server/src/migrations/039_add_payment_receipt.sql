-- Payment receipt fields on students, following the same pattern as the
-- existing document URL columns (resume_url etc.): a pasted hosted link
-- (e.g. Google Drive) rather than an uploaded file, plus the payment/
-- transaction id the student was issued for that payment.
ALTER TABLE students
ADD COLUMN payment_receipt_url TEXT,
ADD COLUMN payment_id VARCHAR(100);
