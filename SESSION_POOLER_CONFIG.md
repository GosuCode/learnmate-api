# Session Pooler Configuration Guide

## Overview

This guide helps you configure session poolers (like PgBouncer) for the LearnMate backend to handle database connections efficiently.

## Why Use Session Poolers?

- **Connection Limits**: Avoid hitting database connection limits
- **Performance**: Reuse connections instead of creating new ones
- **Scalability**: Handle more concurrent users
- **Cost Efficiency**: Reduce database resource usage

## Environment Variables

Add these to your `.env` file:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database?pgbouncer=true&connection_limit=20&pool_timeout=20"

# Session Pooler Settings
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=10000
DB_POOL_MODE=transaction
```

## Common Session Pooler Configurations

### 1. Neon with PgBouncer

```env
DATABASE_URL="postgresql://username:password@ep-xxx-xxx-xxx.region.aws.neon.tech/neondb?pgbouncer=true&connect_timeout=10"
```

### 2. Supabase

```env
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?pgbouncer=true"
```

### 3. Railway with PgBouncer

```env
DATABASE_URL="postgresql://username:password@host:port/database?pgbouncer=true&connection_limit=20"
```

### 4. Self-hosted PgBouncer

```env
DATABASE_URL="postgresql://username:password@pgbouncer-host:6432/database?pgbouncer=true"
```

## Pool Modes

### Transaction Mode (Recommended)

- Connections are returned to the pool after each transaction
- Better for most web applications
- Set `DB_POOL_MODE=transaction`

### Session Mode

- Connections stay open for the entire session
- Use only if you need session-level features
- Set `DB_POOL_MODE=session`

## Connection Parameters

### PgBouncer Parameters

- `pgbouncer=true`: Enables PgBouncer mode
- `connection_limit=20`: Maximum connections per pool
- `pool_timeout=20`: Timeout for getting a connection from pool
- `connect_timeout=10`: Connection establishment timeout

### SSL Configuration

For cloud providers, you might need:

```env
DATABASE_URL="postgresql://...?sslmode=require&pgbouncer=true"
```

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   - Increase `DB_CONNECTION_TIMEOUT`
   - Check pooler connection limits

2. **"Too many connections"**
   - Reduce `DB_MAX_CONNECTIONS`
   - Check pooler configuration

3. **Transaction Errors**
   - Ensure `DB_POOL_MODE=transaction`
   - Check for long-running transactions

### Testing Connection

```bash
# Test direct connection
psql $DATABASE_URL

# Test with pooler
psql "postgresql://...?pgbouncer=true"
```

## Monitoring

The application logs connection events in development mode:

- Query logs
- Connection errors
- Pool exhaustion warnings

## Best Practices

1. **Start Small**: Begin with conservative connection limits
2. **Monitor**: Watch connection usage and adjust accordingly
3. **Test**: Verify pooler behavior in staging environment
4. **Document**: Keep track of your pooler configuration
5. **Backup**: Have a fallback configuration ready

## Migration from Direct Connection

If you're migrating from direct connection:

1. Update `DATABASE_URL` with pooler parameters
2. Set appropriate environment variables
3. Test thoroughly in development
4. Monitor performance in production
5. Adjust settings based on usage patterns
