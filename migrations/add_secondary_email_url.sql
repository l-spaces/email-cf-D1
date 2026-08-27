-- 为 emails 表添加「辅助邮箱链接」字段（用于已存在的数据库）
-- 远程库执行: wrangler d1 execute email-database --remote --file=./migrations/add_secondary_email_url.sql
-- 本地库执行: wrangler d1 execute email-database --local --file=./migrations/add_secondary_email_url.sql
ALTER TABLE emails ADD COLUMN secondary_email_url TEXT;
