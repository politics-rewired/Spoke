CREATE TABLE deliverability_report (
    id int(11) NOT NULL AUTO_INCREMENT,
    period_starts_at timestamp,
    period_ends_at timestamp,
    computed_at timestamp,
    count_total int,
    count_delivered int,
    count_sent int,
    count_error int,
    domain varchar(191),
    url_path varchar(191),
    primary key (id)
) ENGINE=MyISAM;

CREATE INDEX deliverability_period_starts_at_idx ON deliverability_report(period_starts_at);
CREATE INDEX deliverability_period_ends_at_idx ON deliverability_report(period_ends_at);
CREATE INDEX deliverability_messages_total_idx ON deliverability_report(messages_total);
CREATE INDEX deliverability_messages_sent_idx ON deliverability_report(messages_sent);
CREATE INDEX deliverability_messages_unknown_idx ON deliverability_report(messages_unknown);
CREATE INDEX deliverability_messages_erred_idx ON deliverability_report(messages_erred);
CREATE INDEX deliverability_domain_idx ON deliverability_report(domain);
CREATE INDEX deliverability_url_path_idx ON deliverability_report(url_path);
