import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeTBLProductsNameToTitle1702397923167 implements MigrationInterface {
    name = 'ChangeTBLProductsNameToTitle1702397923167'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "name" TO "title"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "title" TO "name"`);
    }

}
