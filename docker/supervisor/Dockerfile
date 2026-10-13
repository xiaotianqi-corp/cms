FROM php:8.4-fpm-alpine

# System + PHP extensions required for Laravel
RUN apk add --no-cache \
    bash \
    git \
    curl \
    unzip \
    icu-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    libxml2-dev \
    libzip-dev \
    zlib-dev \
    shadow \
    autoconf \
    gcc \
    g++ \
    make \
    linux-headers \
    supervisor \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    intl \
    opcache \
    && apk del autoconf gcc g++ make linux-headers \
    && rm -rf /var/cache/apk/*


# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

RUN apk add --no-cache nodejs npm

# Working directory
WORKDIR /var/www/html

# Copy supervisor configuration files
COPY docker/supervisor/*.conf /etc/supervisor/conf.d/

# Create log directory for supervisor
RUN mkdir -p /var/log/supervisor

# Internal exposure (nginx talks to php-fpm via 9000)
EXPOSE 9000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]