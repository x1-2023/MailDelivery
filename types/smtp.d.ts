declare module "smtp-server" {
  export class SMTPServer {
    constructor(options: any)
    listen(port: number, callback?: () => void): void
    on(event: string, callback: (err: any) => void): void
  }
}

declare module "mailparser" {
  export function simpleParser(source: string | Buffer): Promise<any>
}
