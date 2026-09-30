# Dockerfile for VoltGrid Yii2 Framework Backend
FROM php:8.2-fpm-alpine

# Set working directory
WORKDIR /var/www/voltgrid

# Install system dependencies & PHP extensions for Yii2 and MySQL
RUN apk add --no-cache \
    curl \
    git \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    bash \
    mysql-client \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        gd \
        zip \
        intl \
        bcmath \
        opcache \
        mbstring

# Install PECL Redis extension
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy configuration
COPY php.ini /usr/local/etc/php/conf.d/custom.ini

# Expose PHP-FPM port
EXPOSE 9000

CMD ["php-fpm"]
