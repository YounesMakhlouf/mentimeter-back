import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class CreateUserDto {
  @IsNotEmpty({
    message: "field $property  is compulsory",
  })
  @IsEmail()
  email: string;

  @IsNotEmpty({
    message: "field $property  is compulsory",
  })
  @MinLength(6, {
    message:
      "the length of your  $property  is inferior to the minimum length required ($constraint1)",
  })
  password?: string;
}
