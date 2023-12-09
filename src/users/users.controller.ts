import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { CurrentUser } from 'src/utility/decorators/current-user.decorator';
import { AuthenticationGuard } from 'src/utility/guards/auth.guard';
import { AuthorizeRoles } from 'src/utility/decorators/authorize-roles.decorator';
import { Roles } from 'src/utility/common/user-roles.enum';
import { AuthorizeGuard } from 'src/utility/guards/authorization.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    return await this.usersService.createUser(createUserDto);
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
  ): Promise<{ user: UserEntity; accessToken: string }> {
    const user = await this.usersService.loginUser(loginUserDto);
    const accessToken = await this.usersService.accessToken(user);
    return { user, accessToken };
  }

  @Get()
  // @AuthorizeRoles(Roles.ADMIN)
  @UseGuards(AuthenticationGuard, AuthorizeGuard([Roles.ADMIN]))
  async findAll(): Promise<UserEntity[]> {
    return await this.usersService.findAll();
  }
  @Get('me')
  @UseGuards(AuthenticationGuard)
  getProfile(@CurrentUser() user: UserEntity) {
    return user;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
