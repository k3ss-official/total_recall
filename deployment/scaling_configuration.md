# Docker Swarm Scaling Configuration

This document outlines the scaling configuration for the Total Recall project using Docker Swarm.

## Horizontal Scaling with Docker Swarm

```yaml
# docker-compose.swarm.yml
version: '3.8'

services:
  api:
    image: username/totalrecall:latest
    ports:
      - "8000:8000"
    volumes:
      - total_recall_data:/data
    environment:
      - ENV_FILE=.env.prod
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  db:
    image: postgres:14-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
      - POSTGRES_USER=postgres
      - POSTGRES_DB=totalrecall
    deploy:
      placement:
        constraints:
          - node.role == manager
      resources:
        limits:
          cpus: '1'
          memory: 1G

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure

secrets:
  db_password:
    file: ./secrets/db_password.txt

volumes:
  total_recall_data:
  postgres_data:
```

## Load Balancing Configuration

```nginx
# nginx/conf.d/default.conf
upstream totalrecall {
    server api:8000;
    # Additional servers can be added here for load balancing
    # server api2:8000;
    # server api3:8000;
}

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://totalrecall;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://totalrecall/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        access_log off;
        proxy_http_version 1.1;
    }
}
```

## Scaling Considerations

### Horizontal Scaling

The Total Recall application can be horizontally scaled by increasing the number of API service replicas:

```bash
docker service scale totalrecall_api=5
```

### Vertical Scaling

Vertical scaling can be achieved by adjusting the resource limits in the Docker Swarm configuration:

```yaml
deploy:
  resources:
    limits:
      cpus: '1'  # Increase CPU allocation
      memory: 1G  # Increase memory allocation
```

### Database Scaling

For database scaling, consider the following options:

1. **Read Replicas**: Set up PostgreSQL read replicas for read-heavy workloads
2. **Connection Pooling**: Implement PgBouncer for connection pooling
3. **Sharding**: For very large datasets, implement database sharding

### Caching Strategies

Implement caching to improve performance:

1. **Redis Cache**: Add a Redis service for caching frequently accessed data
2. **CDN**: Use a CDN for static assets
3. **In-memory Caching**: Implement application-level caching

## Performance Monitoring

Monitor scaling performance using the Prometheus and Grafana setup:

1. Track CPU and memory usage
2. Monitor request latency
3. Track database connection count
4. Set up alerts for resource thresholds

## Autoscaling

For cloud deployments, consider implementing autoscaling:

1. **AWS**: Use AWS Auto Scaling Groups
2. **GCP**: Use Google Cloud Autoscaling
3. **Azure**: Use Azure Autoscale
4. **Kubernetes**: Use Horizontal Pod Autoscaler if migrating to Kubernetes

## Bottleneck Identification

Common bottlenecks to monitor:

1. Database connection limits
2. Memory usage in API services
3. Network I/O
4. Disk I/O for database operations

Regular performance testing is recommended to identify and address bottlenecks before they impact production.
