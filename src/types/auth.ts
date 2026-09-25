import type {Varchar} from "@prisma/orm-postgres/target/codec-types";
import type {UUID} from "node:crypto";

export interface AuthBody {
    email: Varchar<255>;
    password: Varchar<255>;
    role: Varchar<50>;
}