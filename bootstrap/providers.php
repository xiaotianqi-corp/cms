<?php

use App\Providers\AppServiceProvider;
use App\Providers\EventServiceProvider;
use App\Providers\FortifyServiceProvider;
use App\Providers\PaymentServiceProvider;
use App\Providers\ShippingServiceProvider;
use App\Providers\ShopServiceProvider;
use Resend\Laravel\ResendServiceProvider;

return [
    AppServiceProvider::class,
    EventServiceProvider::class,
    FortifyServiceProvider::class,
    ShopServiceProvider::class,
    ShippingServiceProvider::class,
    PaymentServiceProvider::class,
    ResendServiceProvider::class,
];
