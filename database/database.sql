-- =====================================================================
-- Banco de dados: Conduzindo para o Futuro (PostgreSQL 12 ou superior)
-- =====================================================================
-- O PostgreSQL não tem "CREATE DATABASE IF NOT EXISTS" e não permite trocar
-- de banco dentro do script. Crie o banco antes, em uma execução separada:
--
--     CREATE DATABASE conduzindo_futuro;
--
-- Depois conecte nele (psql -d conduzindo_futuro) e rode este arquivo.
-- =====================================================================

-- ---------------------------------------------------------------------
-- TIPOS ENUMERADOS
-- ---------------------------------------------------------------------
CREATE TYPE tipo_usuario_enum AS ENUM ('ALUNO', 'INSTRUTOR', 'ADMINISTRADOR');

CREATE TYPE dia_semana_enum AS ENUM (
    'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'
);

CREATE TYPE status_agendamento_enum AS ENUM (
    'PENDENTE', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO'
);

CREATE TYPE tipo_documento_enum AS ENUM ('CREDENCIAL_INSTRUTOR', 'CNH', 'CRV');

CREATE TYPE tipo_notificacao_enum AS ENUM ('CONFIRMACAO', 'LEMBRETE');

CREATE TYPE status_envio_enum AS ENUM ('PENDENTE', 'ENVIADO', 'FALHA');

CREATE TYPE tipo_chamado_enum AS ENUM ('DENUNCIA', 'BUG');

CREATE TYPE status_chamado_enum AS ENUM ('ABERTO', 'EM_ANALISE', 'RESOLVIDO');

-- ---------------------------------------------------------------------
-- USUÁRIOS E PERFIS (RF01, RF02, RF03)
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,              -- guardar o HASH da senha (RNF04)
    telefone VARCHAR(20),
    tipo tipo_usuario_enum NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alunos (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    data_nascimento DATE NOT NULL,
    CONSTRAINT fk_aluno_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE instrutores (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    cpf VARCHAR(14) NOT NULL UNIQUE,                       -- RF02
    data_nascimento DATE NOT NULL,                         -- RF02 (idade)
    biografia TEXT,                                        -- RF17 (descrição)
    especialidade VARCHAR(150),
    preco_aula DECIMAL(10,2) NOT NULL DEFAULT 0.00,        -- RF15
    regiao_atendimento VARCHAR(150),                       -- RF16
    whatsapp VARCHAR(20),                                  -- RF14, RF18
    avaliacao_media DECIMAL(3,2) NOT NULL DEFAULT 0.00,    -- RF21
    CONSTRAINT fk_instrutor_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT chk_preco_aula CHECK (preco_aula >= 0)
);

CREATE INDEX idx_instrutores_regiao ON instrutores(regiao_atendimento); -- RF22
CREATE INDEX idx_instrutores_preco  ON instrutores(preco_aula);         -- RF22

CREATE TABLE administradores (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    cargo VARCHAR(100),
    CONSTRAINT fk_administrador_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- CATEGORIAS DE HABILITAÇÃO DO INSTRUTOR (RF17, RF22)
-- ---------------------------------------------------------------------
CREATE TABLE categorias_habilitacao (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(5) NOT NULL UNIQUE,        -- A, B, C, D, E...
    descricao VARCHAR(100)
);

INSERT INTO categorias_habilitacao (codigo, descricao) VALUES
    ('A', 'Motocicletas'),
    ('B', 'Automóveis'),
    ('C', 'Veículos de carga'),
    ('D', 'Veículos de passageiros'),
    ('E', 'Veículos com reboque');

CREATE TABLE instrutor_categorias (
    instrutor_id INT NOT NULL,
    categoria_id INT NOT NULL,
    PRIMARY KEY (instrutor_id, categoria_id),
    CONSTRAINT fk_instcat_instrutor
        FOREIGN KEY (instrutor_id)
        REFERENCES instrutores(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_instcat_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias_habilitacao(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- DOCUMENTOS DO INSTRUTOR (RF02, RNF06)
-- ---------------------------------------------------------------------
CREATE TABLE documentos_instrutor (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    instrutor_id INT NOT NULL,
    tipo tipo_documento_enum NOT NULL,
    caminho_arquivo VARCHAR(255) NOT NULL,    -- caminho em área de acesso restrito
    data_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_documento_instrutor_tipo UNIQUE (instrutor_id, tipo),
    CONSTRAINT fk_documento_instrutor
        FOREIGN KEY (instrutor_id)
        REFERENCES instrutores(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- RECUPERAÇÃO DE SENHA (RF04, RNF05)
-- ---------------------------------------------------------------------
CREATE TABLE tokens_recuperacao_senha (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_expiracao TIMESTAMP NOT NULL,        -- prazo de validade
    usado BOOLEAN NOT NULL DEFAULT FALSE,     -- uso único
    CONSTRAINT fk_token_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- AGENDA DO INSTRUTOR (RF05, RF06)
-- ---------------------------------------------------------------------
CREATE TABLE disponibilidades (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    instrutor_id INT NOT NULL,
    dia_semana dia_semana_enum NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    CONSTRAINT fk_disponibilidade_instrutor
        FOREIGN KEY (instrutor_id)
        REFERENCES instrutores(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT chk_disponibilidade_horario CHECK (horario_fim > horario_inicio)
);

-- ---------------------------------------------------------------------
-- AGENDAMENTOS (RF07 a RF11, RNF07)
-- ---------------------------------------------------------------------
CREATE TABLE agendamentos (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    aluno_id INT NOT NULL,
    instrutor_id INT NOT NULL,
    data_aula DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    status status_agendamento_enum NOT NULL DEFAULT 'PENDENTE',
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelado_por INT NULL,                   -- RF09, RF10: quem cancelou
    data_cancelamento TIMESTAMP NULL,
    CONSTRAINT chk_agendamento_horario CHECK (horario_fim > horario_inicio),
    CONSTRAINT fk_agendamento_aluno
        FOREIGN KEY (aluno_id)
        REFERENCES alunos(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_agendamento_instrutor
        FOREIGN KEY (instrutor_id)
        REFERENCES instrutores(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_agendamento_cancelado_por
        FOREIGN KEY (cancelado_por)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Impede dois agendamentos ativos no mesmo horário com o mesmo instrutor
-- (RNF07). Aulas canceladas ficam fora do índice, então o horário volta a
-- ficar livre para novo agendamento (RF07).
CREATE UNIQUE INDEX uq_horario_instrutor
    ON agendamentos (instrutor_id, data_aula, horario_inicio)
    WHERE status <> 'CANCELADO';

-- ---------------------------------------------------------------------
-- AVALIAÇÕES (RF19, RF20, RF21)
-- ---------------------------------------------------------------------
CREATE TABLE avaliacoes (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    agendamento_id INT NOT NULL UNIQUE,       -- uma avaliação por aula
    aluno_id INT NOT NULL,
    instrutor_id INT NOT NULL,
    nota INT NOT NULL,
    comentario TEXT,
    data_avaliacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_avaliacao_agendamento
        FOREIGN KEY (agendamento_id)
        REFERENCES agendamentos(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_avaliacao_aluno
        FOREIGN KEY (aluno_id)
        REFERENCES alunos(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_avaliacao_instrutor
        FOREIGN KEY (instrutor_id)
        REFERENCES instrutores(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT chk_nota CHECK (nota >= 1 AND nota <= 5)
);

-- ---------------------------------------------------------------------
-- NOTIFICAÇÕES (RF12, RF13)
-- ---------------------------------------------------------------------
CREATE TABLE notificacoes (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INT NOT NULL,
    agendamento_id INT NULL,
    tipo tipo_notificacao_enum NOT NULL,
    status_envio status_envio_enum NOT NULL DEFAULT 'PENDENTE',
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_envio TIMESTAMP NULL,
    CONSTRAINT fk_notificacao_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_notificacao_agendamento
        FOREIGN KEY (agendamento_id)
        REFERENCES agendamentos(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- SUPORTE: DENÚNCIAS E BUGS (RF23)
-- ---------------------------------------------------------------------
CREATE TABLE chamados_suporte (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo tipo_chamado_enum NOT NULL,
    usuario_denunciado_id INT NULL,           -- preenchido apenas em denúncias
    assunto VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    status status_chamado_enum NOT NULL DEFAULT 'ABERTO',
    data_abertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_resolucao TIMESTAMP NULL,
    CONSTRAINT fk_chamado_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_chamado_denunciado
        FOREIGN KEY (usuario_denunciado_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- HISTÓRICO DE AÇÕES
-- ---------------------------------------------------------------------
CREATE TABLE historicos (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT,
    data_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historico_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
