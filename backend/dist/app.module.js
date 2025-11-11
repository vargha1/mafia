"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const throttler_config_1 = require("./config/throttler.config");
const database_config_1 = require("./config/database.config");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const game_module_1 = require("./game/game.module");
const security_middleware_1 = require("./middleware/security.middleware");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            throttler_1.ThrottlerModule.forRoot(throttler_config_1.throttlerConfig),
            typeorm_1.TypeOrmModule.forRoot(database_config_1.databaseConfig.getTypeOrmConfig()),
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            game_module_1.GameModule,
        ],
        providers: [
            security_middleware_1.SecurityMiddleware,
            security_middleware_1.BotDetectionMiddleware,
            security_middleware_1.IPValidationMiddleware,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map