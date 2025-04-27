# Monitoring and Logging Documentation

This document provides detailed information about the monitoring and logging setup for the Total Recall project.

## Monitoring Setup

The Total Recall project uses Prometheus and Grafana for monitoring.

### Prometheus Configuration

Prometheus is used to collect metrics from the application and other services. The configuration is located in the `prometheus/prometheus.yml` file:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'totalrecall'
    static_configs:
      - targets: ['api:8000']
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

#### Key Components

- **Scrape Interval**: How often Prometheus collects metrics (15 seconds)
- **Evaluation Interval**: How often Prometheus evaluates rules (15 seconds)
- **Scrape Configs**: Defines what services to monitor
  - `totalrecall`: The main application
  - `node-exporter`: System metrics (CPU, memory, disk, etc.)

### Grafana Dashboard

Grafana is used to visualize metrics collected by Prometheus. The dashboard configuration is located in the `grafana/dashboards/totalrecall.json` file.

#### Key Metrics

The Grafana dashboard includes the following key metrics:

1. **HTTP Request Rate**: Number of HTTP requests per minute
2. **Memory Usage**: Memory usage of the application
3. **CPU Usage**: CPU usage of the application
4. **Response Time**: Average response time of the application
5. **Error Rate**: Number of errors per minute

#### Setting Up Grafana

1. Start the monitoring stack:
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

2. Access Grafana at http://localhost:3000 (default credentials: admin/admin)

3. Add Prometheus as a data source:
   - URL: http://prometheus:9090
   - Access: Server (default)

4. Import the dashboard:
   - Go to Dashboards > Import
   - Upload the `grafana/dashboards/totalrecall.json` file

## Logging Setup

The Total Recall project uses Fluentd for log aggregation and Elasticsearch for log storage and search.

### Fluentd Configuration

Fluentd is used to collect logs from the application and other services. The configuration is located in the `logging/fluentd.conf` file:

```
<source>
  @type forward
  port 24224
  bind 0.0.0.0
</source>

<match *.**>
  @type copy
  <store>
    @type elasticsearch
    host elasticsearch
    port 9200
    logstash_format true
    logstash_prefix fluentd
    logstash_dateformat %Y%m%d
    include_tag_key true
    type_name access_log
    tag_key @log_name
    flush_interval 1s
  </store>
  <store>
    @type stdout
  </store>
</match>
```

#### Key Components

- **Source**: Defines how logs are collected (forward protocol on port 24224)
- **Match**: Defines how logs are processed and stored
  - `elasticsearch`: Stores logs in Elasticsearch
  - `stdout`: Also outputs logs to standard output for debugging

### Docker Compose Integration

To enable logging in Docker Compose, the services are configured to use the Fluentd logging driver:

```yaml
services:
  api:
    # ... other configuration ...
    logging:
      driver: fluentd
      options:
        fluentd-address: localhost:24224
        tag: app.api
```

### Viewing Logs

There are several ways to view logs:

1. **Docker Compose Logs**:
   ```bash
   docker-compose logs -f
   ```

2. **Kibana** (if using Elasticsearch):
   - Access Kibana at http://localhost:5601
   - Create an index pattern for `fluentd-*`
   - Go to Discover to view and search logs

3. **Direct Service Logs**:
   ```bash
   docker-compose logs -f api
   ```

## Health Checks

Health checks are used to monitor the health of the application and services.

### API Health Check

The API service includes a health check endpoint at `/health` that returns the status of the application.

In the Dockerfile:
```dockerfile
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
```

In Docker Compose:
```yaml
services:
  api:
    # ... other configuration ...
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
```

### Database Health Check

The database service includes a health check to verify that PostgreSQL is running and accepting connections.

```yaml
services:
  db:
    # ... other configuration ...
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

## Alerting

Alerting can be configured in Grafana to notify you when certain conditions are met.

### Setting Up Alerts

1. In Grafana, go to the dashboard and edit a panel
2. Click on the Alert tab
3. Configure the alert conditions
4. Add notification channels (email, Slack, etc.)

### Example Alert Rules

- **High CPU Usage**: Alert when CPU usage is above 80% for 5 minutes
- **High Memory Usage**: Alert when memory usage is above 80% for 5 minutes
- **High Error Rate**: Alert when error rate is above 1% for 5 minutes
- **Service Down**: Alert when a service is down for 1 minute

## Best Practices

1. **Monitor key metrics** that are relevant to your application
2. **Set up alerts** for critical conditions
3. **Regularly review logs** for errors and warnings
4. **Keep monitoring data** for at least 30 days
5. **Use structured logging** for better searchability
6. **Implement log rotation** to manage disk space

## Troubleshooting

### Common Issues

1. **Prometheus not collecting metrics**:
   - Check that the application is exposing metrics
   - Verify that Prometheus can reach the application
   - Check the Prometheus configuration

2. **Grafana not showing data**:
   - Verify that Prometheus is collecting metrics
   - Check the Grafana data source configuration
   - Ensure the dashboard is using the correct queries

3. **Fluentd not collecting logs**:
   - Check that the services are configured to use the Fluentd logging driver
   - Verify that Fluentd is running
   - Check the Fluentd configuration

4. **Health checks failing**:
   - Check the application logs for errors
   - Verify that the health check endpoint is working
   - Ensure the service has enough resources
