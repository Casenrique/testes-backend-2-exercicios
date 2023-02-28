import { UserModel } from "../types"

export interface SignupInputDTO {
    name: unknown,
    email: unknown,
    password: unknown
}

export interface SignupOutputDTO {
    token: string
}

export interface LoginInputDTO {
    email: unknown,
    password: unknown
}

export interface LoginOutputDTO {
    token: string
}

export type GetAllOutputDTO = UserModel[]

export interface DeleteUserInputDTO {
    idToDelete: string,
    token: string | undefined
}

export interface DeleteUserOutputDTO {
    messsage: string,
    token: string
}