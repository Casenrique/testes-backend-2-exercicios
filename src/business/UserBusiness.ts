import { UserDatabase } from "../database/UserDatabase"
import { DeleteUserInputDTO, DeleteUserOutputDTO, GetAllOutputDTO, LoginInputDTO, LoginOutputDTO, SignupInputDTO, SignupOutputDTO } from "../dtos/userDTO";
import { BadRequestError } from "../errors/BadRequestError";
import { NotFoundError } from "../errors/NotFoundError";
import { User } from "../models/User";
import { HashManager } from "../services/HashManager";
import { IdGenerator } from "../services/IdGenerator";
import { TokenManager } from "../services/TokenManager";
import { TokenPayload, UserDB, USER_ROLES } from "../types";

export class UserBusiness {
    constructor(
        private userDatabase: UserDatabase,
        private idGenerator: IdGenerator,
        private tokenManager: TokenManager,
        private hashManager: HashManager
    ) {}

    public signup = async (input: SignupInputDTO): Promise<SignupOutputDTO> => {
        const { name, email, password } = input

        if (typeof name !== "string") {
            throw new BadRequestError("'name' deve ser string")
        }

        if (typeof email !== "string") {
            throw new BadRequestError("'email' deve ser string")
        }

        if (typeof password !== "string") {
            throw new BadRequestError("'password' deve ser string")
        }

        const emailAlreadyExists = await this.userDatabase.findByEmail(email)

        if (emailAlreadyExists) {
            throw new BadRequestError("'email' já existe")
        }

        const id = this.idGenerator.generate()
        const hashedPassword = await this.hashManager.hash(password)
        const role = USER_ROLES.NORMAL
        const createdAt = new Date().toISOString()

        const newUser = new User(
            id,
            name,
            email,
            hashedPassword,
            role,
            createdAt
        )

        const userDB = newUser.toDBModel()

        await this.userDatabase.insert(userDB)

        const payload: TokenPayload = {
            id: newUser.getId(),
            name: newUser.getName(),
            role: newUser.getRole()
        }

        const token = this.tokenManager.createToken(payload)

        const output: SignupOutputDTO = {
            token
        }

        return output
    }

    public login = async (input: LoginInputDTO): Promise<LoginOutputDTO> => {
        const { email, password } = input

        if (typeof email !== "string") {
            throw new BadRequestError("'email' deve ser string")
        }

        if (typeof password !== "string") {
            throw new BadRequestError("'password' deve ser string")
        }

        const userDB: UserDB | undefined = await this.userDatabase.findByEmail(email)

        if (!userDB) {
            throw new NotFoundError("'email' não cadastrado")
        }

        const user = new User(
            userDB.id,
            userDB.name,
            userDB.email,
            userDB.password,
            userDB.role,
            userDB.created_at
        )

        const hashedPassword = user.getPassword()

        const isPasswordCorrect = await this.hashManager
            .compare(password, hashedPassword)
        
        if (!isPasswordCorrect) {
            throw new BadRequestError("'password' incorreto")
        }
        
        const payload: TokenPayload = {
            id: user.getId(),
            name: user.getName(),
            role: user.getRole()
        }

        const token = this.tokenManager.createToken(payload)

        const output: LoginOutputDTO = {
            token
        }

        return output
    }

    public getAll = async (): Promise<GetAllOutputDTO> => {
        const usersDB = await this.userDatabase.getAll()

        const output = usersDB.map((userDB) => {
            const user = new User(
                userDB.id,
                userDB.name,
                userDB.email,
                userDB.password,
                userDB.role,
                userDB.created_at
            )

            return user.toBusinessModel()
        })

        return output
    }

    public deleteUser = async (input: DeleteUserInputDTO): Promise<DeleteUserOutputDTO> => {
        
        const { idToDelete, token } = input
       
        if(token === undefined) {
            throw new BadRequestError("token ausente")
        }

        const payload = this.tokenManager.getPayload(token)

        if(payload === null) {
            throw new BadRequestError("token inválido")
        }
        
        const userDB: UserDB | undefined = await this.userDatabase.searchUserById(idToDelete)

        if(!userDB) {
            throw new NotFoundError("'id' do user não encontrado.")            
        }

        const creatorId = payload.id

        if(payload.role !== USER_ROLES.ADMIN
            && userDB.id !== creatorId
            ) {
            throw new BadRequestError("Somente o criador do user ou admistrador pode apagá-lo.")
        }   
        
        await this.userDatabase.deleteUser(idToDelete)
        
        const output: DeleteUserOutputDTO = {
            messsage: "Usuário apagado com sucesso!",
            token: token
        }

        return output

    }

    public getUserById = async (): Promise<GetAllOutputDTO> => {
        const usersDB = await this.userDatabase.getAll()

        const output = usersDB.map((userDB) => {
            const user = new User(
                userDB.id,
                userDB.name,
                userDB.email,
                userDB.password,
                userDB.role,
                userDB.created_at
            )

            return user.toBusinessModel()
        })

        return output
    }
}