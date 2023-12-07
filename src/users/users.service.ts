import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { hash, compare } from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { sign } from 'jsonwebtoken';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}
  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const userExists = await this.findUserByEmail(createUserDto.email);
    if (userExists) throw new BadRequestException('Email already in use!');
    createUserDto.password = await hash(createUserDto.password, 10);
    let user = await this.userRepository.create(createUserDto);
    user = await this.userRepository.save(user);
    delete user.password;
    return user;
  }
  async loginUser(loginUserDto: LoginUserDto): Promise<UserEntity> {
    const userExists = await this.userRepository
      .createQueryBuilder('users')
      .addSelect('users.password')
      .where('users.email=:email', { email: loginUserDto.email })
      .getOne();
    if (!userExists)
      throw new BadRequestException('Email or password incorrect!');
    const matchedPwd = await compare(
      loginUserDto.password,
      userExists.password,
    );
    if (!matchedPwd)
      throw new BadRequestException('Email or password incorrect!');
    return userExists;
  }

  async findAll(): Promise<UserEntity[]> {
    return await this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new BadRequestException('User with id does not exists');
    }
    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
  async findUserByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOneBy({ email });
  }
  async accessToken(user: UserEntity): Promise<string> {
    return sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.ACCESS_TOKEN_SECRET_KEY,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE_TIME,
      },
    );
  }
}
