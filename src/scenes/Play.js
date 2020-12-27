import Phaser from 'phaser';
import Player from '../entities/Player';
import Enemies from '../groups/Enemies'


class Play extends Phaser.Scene {

    constructor(config) {
        super('PlayScene');
        this.config = config;
    }

    preload() {
        this.load.image('sky', 'assets/sky.png');
    }

    create() {
        const map = this.createMap();
        const layers = this.createLayers(map);
        const playerZones = this.getPlayerZones(layers.playerZones);
        const player = this.createPlayer(playerZones.start);
        const enemies = this.createEnemies(layers.enemySpawns);
        
        this.createEnemyColliders(enemies, {
            colliders: {
                platformColliders: layers.platformColliders,
                player
            }
        });
        
        this.createPlayerColliders(player, {colliders: {
            platformColliders: layers.platformColliders
            }
        });


        this.createEndOfLevel(playerZones.end, player);
        this.setupFollowupCameraOn(player);

        this.plotting = false;
        this.graphics = this.add.graphics();
        this.line = new Phaser.Geom.Line();
        this.graphics.lineStyle(1, 0x00ff00);

        this.input.on('pointerdown', this.startDrawing, this);
        this.input.on('pointerup', pointer => this.finishDrawing(pointer, layers.platforms), this);
    }

    drawDebug(layer) {
        const collidingTileColor = new Phaser.Display.Color(243, 134, 48, 200);

        layer.renderDebug(this.graphics, {
            tileColor: null,
            collidingTileColor
        })
    }

    startDrawing(pointer) {
        if (this.tileHits && this.tileHits.length > 0) {
            this.tileHits.forEach(tile => {
                tile.index !== -1 && tile.setCollision(false);
            })
        }

        this.plotting = true;
        this.line.x1 = pointer.worldX;
        this.line.y1 = pointer.worldY;
    }

    finishDrawing(pointer, layer) {
        this.line.x2 = pointer.worldX;
        this.line.y2 = pointer.worldY;

        this.graphics.clear();
        this.graphics.strokeLineShape(this.line);
        
        this.tileHits = layer.getTilesWithinShape(this.line);

        if (this.tileHits.length > 0) {
        this.tileHits.forEach(tile => {
            tile.index !== -1 && tile.setCollision(true);
        })
        }

        this.drawDebug(layer)

        this.plotting = false;
    }

    createMap() {
        const map = this.make.tilemap({key: 'map'});
        map.addTilesetImage('main_lev_build_1', 'tiles-1');
        map.addTilesetImage('main_lev_build_2', 'tiles-2');
        return map;
    }

    createEnemies(spawnLayer) {
        const enemies = new Enemies(this);
        const enemyTypes = enemies.getTypes();

        spawnLayer.objects.forEach(spawnPoint => {
            const enemy = new enemyTypes[spawnPoint.type](this, spawnPoint.x, spawnPoint.y);
            enemies.add(enemy);
        })

        return enemies;
    }

    createEnemyColliders(enemies, { colliders }) {
        enemies
            .addCollider(colliders.platformColliders)
            .addCollider(colliders.player);
    }

    createLayers(map) {
        const tileset1 = map.getTileset('main_lev_build_1');
        const tileset2 = map.getTileset('main_lev_build_2');
        const platformColliders = map.createStaticLayer('platform_colliders', [tileset1,tileset2]);

        const environment = map.createStaticLayer('environment', [tileset1, tileset2]);
        const platforms = map.createStaticLayer('platforms', [tileset1,tileset2]);

        const playerZones = map.getObjectLayer('player_zones');
        
        const enemySpawns = map.getObjectLayer('enemy_spawns');

        platformColliders.setCollisionByExclusion(-1, true);

        return { environment, platforms, platformColliders, playerZones, enemySpawns };
    }

    createPlayer(start) {
        return new Player(this, start.x, start.y);
    }

    createPlayerColliders(player, {colliders}) {
        player 
            .addCollider(colliders.platformColliders)
    }

    setupFollowupCameraOn(player) {
        const { height, width, mapOffset, zoomFactor } = this.config;
        this.physics.world.setBounds(0,0, width + mapOffset, height + 200);
        this.cameras.main.setBounds(0,0, width + mapOffset, height).setZoom(zoomFactor);
        this.cameras.main.startFollow(player);
    }

    getPlayerZones(playerZonesLayer) {
        const playerZones = playerZonesLayer.objects;
        return {
            start: playerZones[0],
            end: playerZones[1]
        }
    }

    createEndOfLevel(end, player) {
        const endOfLevel = this.physics.add.sprite(end.x, end.y, 'end')
            .setAlpha(0)
            .setOrigin(0.5)
            .setSize(5, 200);

        const endOfLevelOverlap = this.physics.add.overlap(player, endOfLevel, () => {
            endOfLevelOverlap.active = false;
            console.log('game over');
        })
    }

    update() {
        if (this.plotting) {
            const pointer = this.input.activePointer;

            this.line.x2 = pointer.worldX;
            this.line.y2 = pointer.worldY;
            this.graphics.clear();
            this.graphics.strokeLineShape(this.line);
        }

    }
}

export default Play;