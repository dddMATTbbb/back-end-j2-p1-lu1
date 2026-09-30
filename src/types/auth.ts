import type {Varchar} from "@prisma/orm-postgres/target/codec-types";

export interface AuthBody {
    email: Varchar<255>;
    password: Varchar<255>;
    role: Varchar<50>;
}